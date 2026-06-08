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
- [ ] **Galeria visual:** pantalla principal fluida para ver las fotos ya subidas.
- [ ] **Contenerizacion y despliegue:** creacion de `Dockerfile` y `docker-compose.yml` para desplegar el stack en Portainer sobre la Raspberry Pi.

## Fase 2: Mapas Y Visualizacion Avanzada

Estado: futuro.

- [ ] **Integracion de mapas:** incorporar OpenLayers para renderizar un mapa interactivo de Valencia con pines de cada azulejo fotografiado.
- [ ] **Busqueda geografica:** filtrar azulejos cercanos a la ubicacion actual del usuario mediante consultas espaciales en la base de datos con PostGIS.
- [ ] **Filtros y etiquetas:** anadir categorizacion por epocas, estilos arquitectonicos o barrios de Valencia, por ejemplo El Carmen, Ruzafa o Cabanyal.

## Fase 3: Comunidad Y Mejoras

Estado: ideas.

- [ ] **Social:** permitir que otros usuarios, como familiares o amigos conectados a la VPN, puedan comentar o dar me gusta a los azulejos de otros.
- [ ] **Exportacion:** boton para descargar el archivo fotografico y de coordenadas en formatos estandar como JSON o KML por seguridad.

## Siguiente Paso Tecnico

El siguiente paso tecnico pendiente es implementar la galeria visual: pantalla principal fluida para ver las fotos ya subidas y preparar la lectura protegida de imagenes desde almacenamiento local.
