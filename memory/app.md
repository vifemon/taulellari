# PRD: Taulellari

Este documento resume las especificaciones de producto de **Taulellari**. Define el proposito cultural del proyecto, el stack tecnologico fullstack, las restricciones de infraestructura local para Raspberry Pi y el modelo de datos base para usuarios y publicaciones.

## Vision General

**Taulellari** es una plataforma web de uso personal para fotografiar, archivar, catalogar y geolocalizar azulejos, chapados y azulejeria tradicional de la zona de Valencia.

El objetivo principal es salvaguardar visualmente este patrimonio cultural mediante un archivo fotografico privado, geolocalizado y facil de alimentar desde el movil.

## Objetivo Del Proyecto

- Fotografiar azulejos, chapados y azulejeria tradicional durante paseos por Valencia.
- Archivar las fotos de forma local y privada.
- Catalogar cada publicacion con sus coordenadas GPS.
- Conservar un registro visual de elementos patrimoniales que pueden desaparecer o deteriorarse.

## Entorno Y Despliegue

- **Servidor de produccion:** Raspberry Pi como servidor domestico gestionado con Portainer.
- **Acceso y seguridad:** uso privado y local a traves de VPN con Wireguard.
- **Almacenamiento de fotos:** sistema de archivos local en un disco duro SSD conectado a la Raspberry Pi, mapeado mediante un volumen fisico de Docker.
- **Directorio configurable de fotos:** la app usara `PHOTO_STORAGE_DIR` absoluto para escribir las imagenes en el volumen local; si no se configura, en desarrollo usara `uploads/`.
- **Restriccion de infraestructura:** no se usan servicios en la nube para imagenes como S3, Cloudinary u otros equivalentes.
- **Base de datos:** PostgreSQL independiente corriendo en su propio contenedor Docker junto a la app.
- **Desarrollo local en Windows:** durante `npm run dev`, si `NODE_ENV` es `development`, la app usa SQLite local en `dev.db` mediante Drizzle para probar login, publicaciones y galeria sin levantar PostgreSQL.

## Stack Tecnologico

- **Directorio de aplicacion:** `src_app/`.
- **Framework:** Next.js con App Router y TypeScript.
- **Arquitectura:** fullstack dentro de Next.js.
- **Estilos:** CSS Modules (`.module.css`).
- **Enfoque CSS:** mobile-first.
- **Diseño:** interfaz visual potente, con protagonismo absoluto de las imagenes.
- **ORM:** Drizzle ORM para interactuar con PostgreSQL.
- **Iconos:** `lucide-react` como libreria de iconos React tree-shakeable.
- **Base de datos de desarrollo:** Drizzle tambien define un schema SQLite paralelo para `dev.db`; esta base es temporal y no sustituye PostgreSQL en produccion.
- **Testing:** Vitest para pruebas de componentes y logica backend.

## Estado Actual

La **Fase 1.6: Refinamiento y Ajustes** esta en curso sobre la rama `feature/fase-1.6-refinamiento-ajustes`. Ya se refino el hero y el formulario de subida de publicaciones.

## Gestion De Usuarios: Fase 1.5

- **Acceso:** autenticacion real con email y contrasena.
- **Registro:** el usuario debe tener email, nombre, apellidos y contrasena.
- **Contrasenas:** almacenamiento siempre encriptado mediante hash seguro; nunca se guardan contrasenas en texto plano.
- **Sesion:** cookie HTTP-only firmada en servidor mediante `AUTH_SECRET`.
- **CRUD de usuarios:** crear, leer, actualizar y borrar usuarios desde flujos protegidos.
- **Perfil:** cada usuario autenticado tendra una vista de perfil con sus publicaciones y opciones para editar o borrar sus fotos.
- **Rol inicial:** el usuario autenticado puede subir, editar y borrar sus propias publicaciones.
- **Borrado de cuenta:** al eliminar un usuario, sus publicaciones se eliminan por cascade y la app limpia las fotos locales asociadas.

## Modelo De Datos Base

### Usuarios

- `id`
- `email` unico
- `nombre`
- `apellidos`
- `password_hash`
- `creado_en`

### Publicaciones

- `id`
- `titulo`
- `descripcion`, opcional, maximo 120 caracteres
- `latitud`
- `longitud`
- `usuario_id`, relacion con usuarios
- `creado_en`

### Fotos De Publicacion

- `id`
- `publicacion_id`, relacion con publicaciones
- `ruta_local`
- `orden`
- `creado_en`
- Una publicacion puede tener cualquier numero de fotos.

## Geolocalizacion

- **Estrategia de ubicacion:** se implemento un input de autocompletado utilizando la API de Mapbox.
- **Configuracion:** el token de Mapbox se cargara desde `MAPBOX_ACCESS_TOKEN` y no debe versionarse en el repositorio.
- **Precision:** el buscador debe permitir filtrar y autocompletar calles e incluir numeros de portal especificos para seleccionar domicilios exactos.
- **Comportamiento UI:** el buscador debe sugerir direcciones desde la primera letra de forma fluida en una lista flotante debajo del input.
- **Acceso al buscador:** `/api/addresses` es publico para que el HERO pueda mostrar sugerencias a visitantes, manteniendo el token de Mapbox solo en servidor.
- **Datos a guardar:** al seleccionar la direccion, se extraeran y guardaran la latitud y longitud exactas en la tabla `publicaciones`.
- **Formulario de subida:** el selector de direccion evita reabrir sugerencias tras una seleccion valida y su desplegable usa la altura visible disponible antes de activar scroll interno.
- **Fotos multiples:** todos los archivos seleccionados se guardan y se mantienen agrupados bajo la misma publicacion y sus metadatos comunes.

## Decisiones De Producto Y Diseno

- La app es principalmente fotografica y patrimonial.
- La interfaz debe dar prioridad a las imagenes por encima de los controles secundarios.
- Las transiciones deben ser limpias y discretas.
- La carga de imagenes debe estar optimizada para uso movil.
- El uso principal sera en la calle mientras se pasea por Valencia.
- La subida de fotos desde el movil debe ser rapida y sencilla.
- La obtencion de coordenadas debe sentirse nativa, directa y sin friccion, priorizando la seleccion precisa de direccion con numero de portal mediante Mapbox.
- **Navegacion SPA con modales:** toda la experiencia principal ocurre en la raiz (`page.tsx`). Login, registro y formulario de subida mediante boton `+` se abren en modales que ocupan casi toda la pantalla en movil.
- **Hero inicial:** la home comienza con una seccion HERO a pantalla completa (`100vh`), color de fondo temporal, buscador centrado y scroll hacia la galeria.
- **Navegacion interna:** los enlaces a secciones como `#hero` y `#galeria` usan scroll suave, respetando `prefers-reduced-motion`.
- **Galeria publica:** la galeria muestra publicamente solo fotos.
- **Tarjetas de galeria:** las tarjetas muestran solo la imagen; al pasar el cursor o enfocar una imagen con titulo, aparece un overlay oscuro con el titulo.
- **Detalle de fotos multiples:** el modal conserva miniaturas y añade flechas no circulares para navegar por las fotos del mismo grupo, comenzando por la imagen seleccionada.
- **Borrado de fotos:** se elimina solo la foto actual con confirmacion; si era la ultima, tambien se elimina la publicacion y sus metadatos.
- **Datos privados:** descripcion, coordenadas y metadatos sensibles se muestran solo a usuarios logeados.
- **Perfil tipo Instagram:** el perfil de usuario muestra un grid pequeno de sus fotos y permite editar o borrar publicaciones propias.
- **Identidad visual:** paleta inspirada en Manises y boton de modo claro/oscuro en la Navbar.
- **Formulario de subida refinado:** descripcion opcional limitada como el titulo, selector de imagenes personalizado con icono de subida y estados visuales compatibles con modo claro/oscuro.
- **Subida sin limite fijo:** el selector acepta cualquier numero de imagenes compatibles; el limite practico queda condicionado por tamano, almacenamiento y recursos del servidor.
- **Iconografia:** los iconos nuevos deben importarse desde `lucide-react`; el selector de imagenes usa el componente `Upload`.

## Proximos Refinamientos Posibles

- Definir uso consistente de iconos para acciones como subir, buscar, editar, borrar, usuario y tema.

## Estado De Verificacion

- `npm run db:dev:init` correcto.
- `npm run lint` correcto.
- `npm run test` correcto con 26 tests.
- `npm run build` correcto.
- Rama actual de trabajo: `feature/fase-1.6-refinamiento-ajustes`.

## Restricciones Importantes

- La app es privada, no publica.
- El acceso previsto es mediante VPN, no exposicion publica directa.
- Las fotos viven en almacenamiento local, no en la nube.
- PostgreSQL corre como contenedor independiente.
- La Raspberry Pi y el SSD local condicionan las decisiones de rendimiento, almacenamiento y despliegue.
