# Roadmap: Taulellari

Este documento actua como registro de estado y planificacion de tareas del proyecto. Organiza las fases historicas del MVP, las entregas desplegables y las siguientes versiones de **Taulellari**.

## Version 1.0: Producto Minimo Viable

Estado: completada y estable en `develop`.

Las fases 1, 1.5, 1.6, 1.7 y 1.8 forman la version `1.0.0`. Esta es la primera version funcional completa y la referencia que se preparara para el despliegue inicial.

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

Estado: completada en `develop`; cierra el MVP `1.0.0`.

- [x] **Hero glass:** reforzar el efecto glass del panel principal y actualizar la imagen fotografica de fondo.
- [x] **Fondo infinito del Hero:** animar una cinta vertical repetitiva de la imagen principal con movimiento descendente suave, un ciclo de `100s`, uniones reflejadas sin salto y soporte para movimiento reducido.
- [x] **Tema predeterminado:** iniciar la aplicacion en modo oscuro sin eliminar el selector de tema.
- [x] **Navegacion responsive:** convertir la Navbar en un menu hamburguesa hasta `1100px`, con desplegable de ancho completo para tema, perfil o acceso y subida.
- [x] **Perfil en smartphone:** repartir al 50% las acciones secundarias y permitir que el modal crezca y se desplace segun la cantidad de imagenes.
- [x] **Controles de galeria responsive:** mostrar solo iconos Lucide en escritorio; hasta `600px`, colocar los dos selectores en bloques iguales a todo el ancho, con icono y texto completo en la opcion activa e icono solo en la inactiva.
- [x] **Etiqueta de tema:** mostrar en tablet el modo actual junto al icono de sol o luna, manteniendo la accion contraria en `aria-label` y `title`.
- [x] **Barra de galeria:** reducir el buscador a unos `360px`, alinearlo con el borde izquierdo de la galeria o mapa y situar los controles en el borde derecho.
- [x] **Localizacion valenciana:** traducir todo el copy visible y accesible al valenciano de Valencia, declarar `ca-ES-valencia`, localizar fechas, validaciones y errores, y solicitar a Mapbox las direcciones en `ca`.
- [x] **Internacionalizacion i18n:** instalar `i18next` y `react-i18next`, crear catalogos `val`/`es`, migrar el copy a claves `t`, persistir el idioma en cookie y localizar metadata, fechas, mapa, validaciones y errores mediante codigos estables.
- [x] **Selector de idioma:** mostrar `val` o `es` en un control circular equivalente al boton de tema y distribuir tema, idioma y perfil en tres columnas iguales en tablet y smartphone, manteniendo la subida en una segunda fila completa.
- [x] **Ancla de galeria:** reservar sobre el encabezado de `#galeria` un espacio con el fondo real de la pagina equivalente a la altura de la Navbar fija para evitar que `Accedeix` deje el titulo oculto.
- [x] **Confirmacion de foto unica:** simplificar el mensaje de borrado cuando la publicacion contiene una sola imagen, cubrir tambien el flujo desde el perfil y resincronizar los catalogos i18next durante Fast Refresh.
- [x] **Hero movil refinado:** limitar el panel a un minimo de `50svh`, centrar su contenido y aumentar la presencia tipografica del titulo hasta `96px` en pantallas de `860px` o menos.
- [x] **Estado y preferencias centralizados:** inicializar la sesion en servidor y reunir idioma, tema, vista y alcance en `AppStateProvider`, persistiendo los ajustes no sensibles en una cookie validada y manteniendo el token de autenticacion separado y HTTP-only.
- [x] **Ajustes finales:** cerrar las correcciones iterativas y declarar estable el MVP `1.0.0`.

## Despliegue De La Version 1.0

Estado: siguiente frente operativo.

- [ ] **Contenerizacion y despliegue:** creacion de `Dockerfile` y `docker-compose.yml` para desplegar el stack en Portainer sobre la Raspberry Pi.
- [ ] **Validacion de infraestructura:** comprobar PostgreSQL, volumen persistente del SSD, `PHOTO_STORAGE_DIR`, secretos y acceso privado mediante Wireguard.
- [ ] **Seguridad de dependencias:** resolver antes del despliegue los avisos de produccion detectados por `npm audit`, que afectan a Next.js y dependencias transitivas, y repetir toda la validacion tras actualizar.
- [ ] **Primera entrega:** desplegar y verificar `1.0.0` antes de sustituirla por una version posterior.

## Version 1.1: Movimiento Y Refinamiento Visual

Estado: iniciada sobre `feature/v1.1-gsap`.

- [x] **Integracion de GSAP:** incorporar `gsap`, `@gsap/react` y `ScrollTrigger` mediante un punto de registro compartido compatible con renderizado en servidor.
- [x] **Primera animacion:** reducir un 20% el ancho del panel del Hero y traducir la velocidad vertical del scroll a un `skewY` limitado con retorno suave.
- [x] **Accesibilidad y ciclo de vida:** respetar `prefers-reduced-motion` y limpiar el trigger, la llamada diferida y el tween al desmontar el Hero.
- [x] **Rendimiento y regresion:** limitar la velocidad y deformacion, mantener el fondo continuo en CSS y validar ESLint, pruebas y build de produccion.
- [x] **Lenis smooth scroll:** suavizar siempre el desplazamiento global y los anchors, sincronizar Lenis con el ticker de GSAP, respetar movimiento reducido y excluir los modales del suavizado.
- [x] **Cambio de vista sin salto:** conservar el `scrollY` absoluto al alternar entre mapa y galeria mediante una reserva temporal de altura, resincronizacion de Lenis y retirada automatica del espacio cuando deja de ser necesario.
- [x] **Footer de creditos:** añadir al final de ambas vistas un credito discreto con revelado parallax reversible mediante GSAP, recalculo ante cambios de altura y fallback sin animacion para movimiento reducido.
- [x] **Loader de azulejos:** cubrir el espacio galeria/mapa durante la carga inicial, primera imagen y montaje de OpenLayers con un mosaico tematico animado por GSAP, accesible, localizado y sin bloquear el Hero.
- [ ] **Redespliegue:** desplegar `1.1.0` solo cuando la integracion de GSAP este terminada y validada; hasta entonces `1.0.0` sigue siendo la referencia estable.

## Siguiente Paso Tecnico

El siguiente paso operativo es preparar el despliegue de **Taulellari 1.0.0**. En `feature/v1.1-gsap`, corresponde validar en navegador el cambio de vista sin salto, el footer parallax y el loader tematico antes de cerrar `1.1.0` como siguiente candidata a despliegue.

## Ultimo Estado Git

- Rama estable: `develop`, referencia del MVP `1.0.0`.
- Rama de desarrollo activa: `feature/v1.1-gsap`.
- La futura version `1.1.0` sera la siguiente candidata a redespliegue cuando complete su validacion.
