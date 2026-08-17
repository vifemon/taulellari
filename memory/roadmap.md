# Roadmap: Taulellari

Este documento actua como registro de estado y planificacion de tareas del proyecto. Divide el desarrollo de **Taulellari** en tres fases evolutivas y sirve para identificar que tareas estan completadas y cual es el siguiente paso tecnico a ejecutar.

## Fase 1: Producto Minimo Viable

Estado: completada como base tecnica inicial.

- [x] **Configuracion del entorno:** inicializacion de Next.js, TypeScript y configuracion de tests con Vitest.
- [x] **Herramientas del agente:** puesta a punto de `tools/`, incluyendo control de base de datos con `db_tool.sh`, git y scripts operativos.
- [x] **Base de datos y modelado:** instalacion de Drizzle ORM, schema de `usuarios` y `publicaciones`, y migracion inicial para crear las tablas.
- [x] **Autenticacion:** API de backend para registro rapido por email, cierre de sesion y consulta de usuario autenticado mediante cookie HTTP-only firmada.
- [x] **Modulo de captura y almacenamiento:** API de Next.js para procesar archivos multipart de imagenes y guardarlos en la carpeta local del servidor.
- [x] **Formulario movil de subida:** formulario frontend responsivo y mobile-first para subir cualquier numero de fotos, titulo e input de direccion con autocompletado de Mapbox para capturar coordenadas exactas con numero de portal.
- [x] **Galeria visual:** pantalla principal fluida para ver las fotos ya subidas con lectura protegida desde almacenamiento local.
- [x] **Desarrollo local temporal:** modo hibrido con SQLite (`dev.db`) en Windows 11 para probar login, autocompletado Mapbox, capturas y galeria sin levantar PostgreSQL.

## Fase 1.5: Reestructuracion Completa UI/UX Y CRUD De Usuarios

Estado: completada y mergeada en `develop`.

- [x] **CRUD completo de usuarios:** sustituido el login simplificado por autenticacion real con email, nombre, apellidos y contrasena hasheada con `bcryptjs`; permite registro, lectura de sesion, actualizacion y borrado de usuario.
- [x] **Navegacion SPA con modales:** experiencia principal en la raiz mediante `AppShell`; login, registro, subida, edicion y perfil se abren en modales.
- [x] **Seccion HERO:** seccion inicial a pantalla completa (`100vh`) con buscador y scroll hacia la galeria.
- [x] **Galeria publica y datos privados:** fotos publicas; descripcion, coordenadas, propietario y acciones solo con sesion.
- [x] **Perfil de usuario:** vista de perfil con grid pequeno estilo Instagram para publicaciones propias.
- [x] **Identidad visual:** paleta inspirada en Manises y boton claro/oscuro en la Navbar.
- [x] **Correccion Mapbox:** buscador con sugerencias desde la primera letra en lista flotante; `/api/addresses` es publico para el HERO.
- [x] **Edicion y borrado de publicaciones propias:** endpoint `PATCH/DELETE /api/publicaciones/[id]` protegido por propietario.
- [x] **Limpieza de archivos:** borrado de publicaciones y cuenta elimina fotos locales asociadas.
- [x] **Migraciones:** anadidos campos `nombre`, `apellidos` y `password_hash` en PostgreSQL y SQLite local; runner SQLite aplica multiples migraciones.
- [x] **Verificacion:** `npm run db:dev:init`, `npm run lint`, `npm run test` y `npm run build` pasan.

## Fase 1.6: Refinamiento y Ajustes Concretos

Estado: completada y mergeada en `develop`.

- [x] **Buscador de galeria:** mover el buscador desde el HERO a la parte superior de la galeria y cambiarlo de busqueda Mapbox a filtro de imagenes por titulo, descripcion o metadatos.
- [x] **Imagen de fondo y acciones del HERO:** eliminar el decorativo `::after`, usar una imagen real de fondo en `heroScreen` y destacar las acciones principales de ver galeria y subir imagen.
- [x] **Fotos multiples:** guardar cualquier numero de imagenes por publicacion, mostrar cada foto en la galeria y navegar por el grupo con miniaturas y flechas no circulares.
- [x] **Borrado individual:** confirmar el borrado de la foto actual y eliminar el grupo cuando se borra su ultima imagen.
- [x] **Galeria masonry:** presentar las fotos en columnas responsive tipo Pinterest manteniendo la proporcion natural, con dos columnas tambien en mobile.
- [x] **Filtro de galeria:** añadir toggle con iconos Lucide para alternar entre todas las publicaciones y las del usuario autenticado.
- [x] **Modales responsive:** sustituir el cierre textual por `X` y corregir el acceso al contenido del detalle en tablet y movil.
- [x] **Hero responsive:** apilar y centrar las acciones en tablet y ampliar verticalmente el contenedor en pantallas pequeñas.
- [x] **Iconos de tema:** sustituir el texto del selector claro/oscuro por los iconos Lucide `Sun` y `Moon`.
- [x] **Alineacion de acciones:** centrar los iconos `Sun`, `Moon` y `Plus` dentro de sus contenedores.
- [x] **Perfil refinado:** mejorar la ficha visual y permitir borrar una foto desde su miniatura con confirmacion.
- [x] **Etiquetas de direcciones:** evitar la duplicacion de codigo postal, municipio, provincia y pais en las sugerencias y valores guardados.

## Fase 1.7: Implementacion De Funcionalidad De Mapa Con OpenLayers

Estado: completada y mergeada en `develop`.

- **Biblioteca:** OpenLayers (`ol`).
- **Centro inicial:** Comunitat Valenciana.
- **Clusterizacion obligatoria:** usar `ol/source/Cluster` para agrupar puntos que no puedan distinguirse por el nivel de zoom. Las publicaciones con la misma coordenada exacta deben mantenerse agrupadas siempre e indicar el numero total de imagenes de esa ubicacion.
- **Marcadores:** los puntos individuales mostraran una miniatura de la foto principal dentro de un marco personalizado con la paleta de la aplicacion; los clusters se representaran con un circulo estilizado y su contador.
- [x] **Paso 1. Selector de vista:** instalado `ol` y anadido, junto al selector de "Mis publicaciones / Todas las publicaciones", un selector para alternar entre "Vista Galeria" y "Vista Mapa" con los iconos `Images` y `Map` de `lucide-react`. Al elegir mapa se renderiza inicialmente un contenedor vacio preparado para OpenLayers.
- [x] **Paso 2. Carga de datos, centrado y clusterizacion:** mapa centrado en la Comunitat Valenciana, con publicaciones geolocalizadas cargadas desde la API y agrupadas por proximidad o coordenadas identicas.
- [x] **Paso 2, vertical 1. Mapa base:** renderizado el mapa de OpenLayers con la capa base monocroma Carto Positron en modo claro y Carto Dark Matter en modo oscuro, sincronizada con el selector de tema y centrada inicialmente en la Comunitat Valenciana.
- [x] **Paso 2, vertical 2. Datos y marcadores:** publicaciones geolocalizadas integradas en una capa vectorial con `ol/source/Cluster`; los puntos individuales muestran la miniatura principal recortada en un marco circular y el total de fotos, mientras los clusters muestran el total de imagenes con el color terciario de la aplicacion.
- [x] **Paso 3. Reactividad, filtros y modal:** marcadores sincronizados con la busqueda y el filtro de publicaciones; los marcadores individuales abren el modal de detalle existente y los clusters de coordenadas distintas aplican zoom progresivo. Anadido un control `LocateFixed` debajo del zoom para restablecer el centro y zoom iniciales de la Comunitat Valenciana. Cubierto con pruebas de filtros, modal y tema.

## Fase 1.8: Correcciones

Estado: en curso sobre `develop`.

- [x] **Hero glass:** reforzar el efecto glass del panel principal y actualizar la imagen fotografica de fondo.
- [x] **Fondo infinito del Hero:** animar una cinta vertical repetitiva de la imagen principal con movimiento descendente suave, un ciclo de `100s`, uniones reflejadas sin salto y soporte para movimiento reducido.
- [x] **Tema predeterminado:** iniciar la aplicacion en modo oscuro sin eliminar el selector de tema.
- [x] **Navegacion responsive:** convertir la Navbar en un menu hamburguesa hasta `1100px`, con desplegable de ancho completo para tema, perfil o acceso y subida.
- [x] **Perfil en smartphone:** repartir al 50% las acciones secundarias y permitir que el modal crezca y se desplace segun la cantidad de imagenes.
- [x] **Controles de galeria simplificados:** mostrar los selectores de alcance y vista solo mediante iconos Lucide accesibles; usar `Users` y `MapPinned` para todas las publicaciones y mapa.
- [x] **Barra de galeria:** reducir el buscador a unos `360px`, alinearlo con el borde izquierdo de la galeria o mapa y situar los controles en el borde derecho.
- [x] **Localizacion valenciana:** traducir todo el copy visible y accesible al valenciano de Valencia, declarar `ca-ES-valencia`, localizar fechas, validaciones y errores, y solicitar a Mapbox las direcciones en `ca`.
- [x] **Internacionalizacion i18n:** instalar `i18next` y `react-i18next`, crear catalogos `val`/`es`, migrar el copy a claves `t`, persistir el idioma en cookie y localizar metadata, fechas, mapa, validaciones y errores mediante codigos estables.
- [x] **Selector de idioma:** mostrar `val` o `es` en un control circular equivalente al boton de tema y distribuir tema, idioma y perfil en tres columnas iguales en tablet y smartphone, manteniendo la subida en una segunda fila completa.
- [x] **Ancla de galeria:** reservar sobre el encabezado de `#galeria` un espacio con el fondo real de la pagina equivalente a la altura de la Navbar fija para evitar que `Accedeix` deje el titulo oculto.
- [ ] **Ajustes finales:** continuar realizando pequenas correcciones y refinamientos de forma iterativa.

## Fase 2: Contenerizacion Y Despliegue

Estado: pendiente tras la Fase 1.8.

- [ ] **Contenerizacion y despliegue:** creacion de `Dockerfile` y `docker-compose.yml` para desplegar el stack en Portainer sobre la Raspberry Pi.

## Fase 3: Mapas Y Visualizacion Avanzada

Estado: futuro.

- [ ] **Busqueda geografica:** filtrar azulejos cercanos a la ubicacion actual del usuario mediante consultas espaciales en la base de datos con PostGIS.
- [ ] **Filtros y etiquetas:** anadir categorizacion por epocas, estilos arquitectonicos o barrios de Valencia, por ejemplo El Carmen, Ruzafa o Cabanyal.

## Fase 4: Comunidad Y Mejoras

Estado: ideas.

- [ ] **Social:** permitir que otros usuarios, como familiares o amigos conectados a la VPN, puedan comentar o dar me gusta a los azulejos de otros.
- [ ] **Exportacion:** boton para descargar el archivo fotografico y de coordenadas en formatos estandar como JSON o KML por seguridad.

## Siguiente Paso Tecnico

El siguiente paso tecnico es continuar la **Fase 1.8: Correcciones** de forma iterativa hasta cerrar los ajustes finales de la aplicacion.

## Ultimo Estado Git

- Rama actual: `develop`.
- `develop` contiene la internacionalizacion valenciano/castellano y el selector de idioma responsive de la Fase 1.8.
- La interfaz, metadata, etiquetas accesibles, validaciones y errores orientados al usuario se resuelven desde los catalogos descritos en `memory/app.md`.
