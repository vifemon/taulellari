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
- **Restriccion de infraestructura:** no se usan servicios en la nube para imagenes como S3, Cloudinary u otros equivalentes.
- **Base de datos:** PostgreSQL independiente corriendo en su propio contenedor Docker junto a la app.

## Stack Tecnologico

- **Directorio de aplicacion:** `src_app/`.
- **Framework:** Next.js con App Router y TypeScript.
- **Arquitectura:** fullstack dentro de Next.js.
- **Estilos:** CSS Modules (`.module.css`).
- **Enfoque CSS:** mobile-first.
- **Diseño:** interfaz visual potente, con protagonismo absoluto de las imagenes.
- **ORM:** Drizzle ORM para interactuar con PostgreSQL.
- **Testing:** Vitest para pruebas de componentes y logica backend.

## Gestion De Usuarios: Fase 1

- **Acceso:** registro e inicio de sesion simplificado solo mediante correo electronico.
- **Contrasenas:** no se contemplan contrasenas complejas inicialmente.
- **Rol:** el usuario autenticado es el unico que puede subir publicaciones y geolocalizarlas.

## Modelo De Datos Base

### Usuarios

- `id`
- `email` unico
- `creado_en`

### Publicaciones

- `id`
- `ruta_local_foto_1`
- `ruta_local_foto_2`, opcional, maximo 2 fotos por publicacion
- `latitud`
- `longitud`
- `usuario_id`, relacion con usuarios
- `creado_en`

## Decisiones De Producto Y Diseno

- La app es principalmente fotografica y patrimonial.
- La interfaz debe dar prioridad a las imagenes por encima de los controles secundarios.
- Las transiciones deben ser limpias y discretas.
- La carga de imagenes debe estar optimizada para uso movil.
- El uso principal sera en la calle mientras se pasea por Valencia.
- La subida de fotos desde el movil debe ser rapida y sencilla.
- La obtencion de coordenadas GPS debe sentirse nativa, directa y sin friccion.

## Restricciones Importantes

- La app es privada, no publica.
- El acceso previsto es mediante VPN, no exposicion publica directa.
- Las fotos viven en almacenamiento local, no en la nube.
- PostgreSQL corre como contenedor independiente.
- La Raspberry Pi y el SSD local condicionan las decisiones de rendimiento, almacenamiento y despliegue.
