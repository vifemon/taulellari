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

## Fase 1.5: Depuracion UI/UX

Estado: siguiente fase inmediata.

- [ ] **Revision visual mobile-first:** ajustar jerarquia, espaciados, contraste, legibilidad y comportamiento en pantallas pequenas.
- [ ] **Flujo de captura:** pulir estados de carga, errores, confirmaciones, seleccion de direccion y seleccion de imagenes.
- [ ] **Galeria:** revisar composicion visual, proporciones de imagen, estados vacios y lectura de metadatos.
- [ ] **Accesibilidad basica:** revisar foco, etiquetas, navegacion por teclado y mensajes de estado.

## Fase 2: Contenerizacion Y Despliegue

Estado: pendiente tras depuracion UI/UX.

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

El siguiente paso tecnico pendiente es detenerse en la Fase 1.5 de depuracion UI/UX antes de continuar con contenerizacion y despliegue.
