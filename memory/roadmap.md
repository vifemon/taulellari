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

Estado: en curso sobre `feature/fase-1.7-mapa-openlayers`.

- [ ] **Visualizacion cartografica:** integrar OpenLayers para mostrar un mapa interactivo con las publicaciones geolocalizadas.

## Fase 1.8: Correcciones

Estado: pendiente tras la Fase 1.7.

- [ ] **Ajustes finales:** realizar pequeñas correcciones y refinamientos finales de la aplicacion.

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

El siguiente paso tecnico es desarrollar la **Fase 1.7: Implementacion de funcionalidad de mapa con OpenLayers**, integrando la visualizacion cartografica de las publicaciones de forma iterativa.

## Ultimo Estado Git

- Rama actual antes de iniciar la Fase 1.7: `develop`.
- `develop` mergeada con `feature/fase-1.6-refinamiento-ajustes` mediante fast-forward.
- Commit principal: `403c85d style: simplify gallery search`.
- `develop` tiene los cambios de la Fase 1.6 pendientes de push a `origin/develop`.
- Rama actual para la Fase 1.7: `feature/fase-1.7-mapa-openlayers`.
