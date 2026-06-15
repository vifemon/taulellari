# Roadmap: Taulellari

Este documento actua como registro de estado y planificacion de tareas del proyecto. Divide el desarrollo de **Taulellari** en tres fases evolutivas y sirve para identificar que tareas estan completadas y cual es el siguiente paso tecnico a ejecutar.

## Fase 1: Producto Minimo Viable

Estado: en desarrollo.

- [x] **Configuracion del entorno:** inicializacion de Next.js, TypeScript y configuracion de tests con Vitest.
- [x] **Herramientas del agente:** puesta a punto de `tools/`, incluyendo control de base de datos con `db_tool.sh`, git y scripts operativos.
- [x] **Base de datos y modelado:** instalacion de Drizzle ORM, schema de `usuarios` y `publicaciones`, y migracion inicial para crear las tablas.
- [x] **Autenticacion:** API de backend para registro rapido por email, cierre de sesion y consulta de usuario autenticado mediante cookie HTTP-only firmada.
- [x] **Modulo de captura y almacenamiento:** API de Next.js para procesar archivos multipart de imagenes y guardarlos en la carpeta local del servidor.
- [x] **Formulario movil de subida:** formulario frontend responsivo y mobile-first para subir hasta 3 fotos, titulo e input de direccion con autocompletado de Mapbox para capturar coordenadas exactas con numero de portal.
- [x] **Galeria visual:** pantalla principal fluida para ver las fotos ya subidas con lectura protegida desde almacenamiento local.
- [x] **Desarrollo local temporal:** modo hibrido con SQLite (`dev.db`) en Windows 11 para probar login, autocompletado Mapbox, capturas y galeria sin levantar PostgreSQL.

## Fase 1.5: Reestructuracion Completa UI/UX Y CRUD De Usuarios

Estado: siguiente fase inmediata.

- [ ] **CRUD completo de usuarios:** sustituir el login simplificado por autenticacion real con email, nombre, apellidos y contrasena encriptada; permitir crear, leer, actualizar y borrar usuarios.
- [ ] **Navegacion SPA con modales:** mantener toda la experiencia principal en la raiz (`page.tsx`) y abrir login, registro y formulario de subida (`+`) en modales casi full-screen en movil.
- [ ] **Seccion HERO:** crear una seccion inicial a pantalla completa (`100vh`) con color de fondo temporal, buscador centrado y scroll hacia la galeria.
- [ ] **Galeria publica y datos privados:** mostrar publicamente solo fotos; mostrar descripcion, coordenadas y metadatos privados solo cuando el usuario este logeado.
- [ ] **Perfil de usuario:** crear una vista de perfil con grid pequeno estilo Instagram para que cada usuario pueda editar o borrar sus fotos.
- [ ] **Identidad visual:** aplicar paleta de colores inspirada en Manises y anadir boton de modo claro/oscuro en la Navbar.
- [ ] **Correccion Mapbox:** modificar el buscador para sugerir direcciones desde la primera letra de forma fluida en una lista flotante bajo el input.

## Fase 2: Contenerizacion Y Despliegue

Estado: pendiente tras la reestructuracion UI/UX y CRUD de usuarios.

- [ ] **Contenerizacion y despliegue:** creacion de `Dockerfile` y `docker-compose.yml` para desplegar el stack en Portainer sobre la Raspberry Pi.

## Fase 3: Mapas Y Visualizacion Avanzada

Estado: futuro.

- [ ] **Integracion de mapas:** incorporar OpenLayers para renderizar un mapa interactivo de Valencia con pines de cada azulejo fotografiado.
- [ ] **Busqueda geografica:** filtrar azulejos cercanos a la ubicacion actual del usuario mediante consultas espaciales en la base de datos con PostGIS.
- [ ] **Filtros y etiquetas:** anadir categorizacion por epocas, estilos arquitectonicos o barrios de Valencia, por ejemplo El Carmen, Ruzafa o Cabanyal.

## Fase 4: Comunidad Y Mejoras

Estado: ideas.

- [ ] **Social:** permitir que otros usuarios, como familiares o amigos conectados a la VPN, puedan comentar o dar me gusta a los azulejos de otros.
- [ ] **Exportacion:** boton para descargar el archivo fotografico y de coordenadas en formatos estandar como JSON o KML por seguridad.

## Siguiente Paso Tecnico

El siguiente paso tecnico pendiente es detenerse en la Fase 1.5 de reestructuracion completa UI/UX y CRUD de usuarios antes de continuar con contenerizacion y despliegue.
