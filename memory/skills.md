# Skills Instaladas

Fecha de registro: 2026-05-31

## Instalacion

- Comando ejecutado: `npx autoskills@latest`
- Version instalada por npm: `autoskills@0.3.6`
- Comando adicional ejecutado: `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices --yes`
- Comando adicional ejecutado: `npx skills add https://github.com/vercel-labs/next-skills --skill next-best-practices --yes`
- Version instalada por npm para CLI `skills`: `skills@1.5.9`
- Directorio de instalacion: `.agents/skills/`
- Lockfile generado: `skills-lock.json`

## Inventario

- `accessibility`: auditoria y mejora de accesibilidad web siguiendo WCAG 2.2. Fuente: `addyosmani/web-quality-skills`.
- `bash-defensive-patterns`: patrones defensivos para scripts Bash, CI/CD y utilidades de sistema robustas. Fuente: `wshobson/agents`.
- `frontend-design`: guia para interfaces frontend distintivas, pulidas y de calidad de produccion. Fuente: `anthropics/skills`.
- `next-best-practices`: buenas practicas de Next.js para App Router, RSC boundaries, async APIs, metadata, route handlers, runtime selection, self-hosting y convenciones de archivos. Fuente: `vercel-labs/next-skills`.
- `seo`: optimizacion tecnica SEO, meta tags, datos estructurados, sitemap y visibilidad en buscadores. Fuente: `addyosmani/web-quality-skills`.
- `vercel-react-best-practices`: buenas practicas de rendimiento para React y Next.js mantenidas por Vercel Engineering. Fuente: `vercel-labs/agent-skills`.

## Notas Operativas

- Las skills quedaron como `SKILL.md` bajo `.agents/skills/<nombre>/`.
- `next-best-practices` incluye guias adicionales sobre route handlers, RSC, metadata, self-hosting, bundling, images, fonts, scripts y errores.
- `vercel-react-best-practices` incluye recursos adicionales: `AGENTS.md`, `README.md`, `metadata.json` y `rules/`.
- Esta sesion puede no detectar skills nuevas hasta reiniciar opencode, porque las skills se cargan al iniciar.
- `skills-lock.json` registra fuente y hash de cada skill instalada.
