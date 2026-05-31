# Agent Harness

Estructura base del entorno de desarrollo para operar de forma organizada con subagentes, capacidades, herramientas y contexto del proyecto.

## Directorios

- `agents/`: definiciones fuente de subagentes especializados del Harness.
- `.opencode/agents/`: copias de los subagentes en formato discoverable por OpenCode.
- `.agents/skills/`: skills instaladas para los agentes mediante `autoskills` o `skills add`.
- `tools/`: herramientas personalizadas de ejecucion, validacion o testing.
- `memory/`: contexto persistente, notas del proyecto y estado actual del trabajo.
- `src_app/`: espacio reservado para el codigo de la aplicacion Next.js.
