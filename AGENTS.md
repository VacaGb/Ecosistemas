# Sabana: criterios del proyecto

## Objetivo

Juego educativo multijugador con flujo directo: entrar, esperar, decidir y ver resultados. Mantener la personalidad de concurso que pidió el usuario: respuestas de colores, transiciones y celebración, con pocas acciones visibles.

## Skills locales

`opencode.json` registra `C:/Users/hu250/.agents/skills`. Se reutiliza la colección existente completa sin instalar ni duplicar sus archivos. Esta ruta es local: en otro equipo se debe ajustar.

Seleccionar skills por el trabajo concreto, leyendo su `SKILL.md` y las referencias necesarias:

- `redesign-existing-projects`: diagnóstico y mejoras incrementales del diseño existente.
- `animate`: implementación de movimiento con propósito, tiempos, curvas y accesibilidad.
- `emil-design-eng`: detalles de interacción, feedback y coherencia visual.
- `review-animations`: revisión de movimiento, cuando se solicite una revisión.
- `minimalist-ui`: para trabajos que pidan expresamente su estética editorial. Sus restricciones visuales no deben sustituir automáticamente el estilo de concurso y sus colores semánticos.
- `improve-animations`: auditoría y planes, no implementación. No activarla como ejecutora de código.

Las demás skills permanecen disponibles para tareas que correspondan a sus descripciones. No aplicar simultáneamente estilos incompatibles ni cargar herramientas nativas de iOS/Expo en esta aplicación web.

## Reglas de implementación

- No instalar paquetes, navegadores, librerías, skills ni otras herramientas sin una nueva autorización explícita del usuario.
- Conservar Express, Socket.IO y JavaScript/CSS nativos. Las reglas del juego pertenecen al servidor.
- Mantener las rutas relativas y `?role=host` para GitHub Pages; conservar `/host` y `/player` locales.
- Una acción principal por pantalla. No añadir paneles, menús ni opciones decorativas.
- Colores y símbolos deben identificar respuestas sin depender solo del color.
- Mantener el DOM de una pregunta cuando cambia el número de respuestas. No reiniciar animaciones ni perder el foco por actualizaciones en tiempo real.
- Animar principalmente `transform` y `opacity`; transiciones cortas para interacción, celebraciones más largas solo al terminar.
- Respetar movimiento reducido, teclado y dispositivos táctiles; conservar estados de carga, error, vacío y reconexión.
- Verificar con las herramientas ya disponibles. `npm.cmd test` ejecuta la suite en Windows; no equivale a una comprobación visual del navegador.
- No publicar, hacer commits o desplegar sin que el usuario lo pida.
