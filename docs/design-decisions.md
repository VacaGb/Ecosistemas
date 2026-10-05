# Diseño y movimiento

## Dirección

Base clara y cálida, tipografía Outfit/DM Sans, una acción principal y respuestas con colores semánticos y símbolos. La pantalla inicial solo pide código, nombre y animal. Los animales siguen siendo avatares de una expedición humana.

## Revisión aplicada

| Antes | Después | Motivo |
| --- | --- | --- |
| Interacciones de 400–850 ms | Feedback de 160 ms y entrada de 240 ms | Responder sin esperar a una animación |
| Hover también en pantallas táctiles | Hover solo para puntero fino | Evitar estados de hover pegados al tocar |
| Aviso que anima márgenes | Aparición por opacidad con transición | Evitar recálculo de layout y permitir interrupción |
| Saltos de escala grandes en listas | Entrada desde escala 0.97 y desplazamiento corto | Conservar continuidad visual |
| Movimiento reducido sin feedback | Desvanecimientos cortos, sin traslación ni confeti | Mantener confirmación sin movimiento |
| Cambio de pantalla sin foco | Foco en el título solo al cambiar de etapa | Continuidad para navegación por teclado |
| Error de formulario temporal | Mensaje junto al formulario, conservando los datos | Poder corregir sin perder contexto |
| Recursos ajenos visibles en cada tabla | Clasificación breve de nombre y puntos | Mostrar primero lo que importa |

## Presupuesto de movimiento

- **Feedback:** botones, 160 ms. Sin animación de entrada al cambiar una selección de animal.
- **Cambio de estado:** pantalla, participante y tarjeta, 240 ms; cascada de 50 ms.
- **Temporizador:** barra lineal sincronizada con el servidor, alerta visual y último tramo numérico.
- **Espera:** indicadores pequeños; no mover el texto que se está leyendo.
- **Celebración:** puntos, podio y confeti solo en resultados, sin bloquear botones.
- **Teclado:** la confirmación de respuesta es inmediata; los atajos no dependen de animaciones.
- **Movimiento reducido:** opacidad de 160 ms; sin desplazamientos, partículas ni pulsaciones.

Curva compartida: `cubic-bezier(0.23, 1, 0.32, 1)`, según `animate` y `emil-design-eng`.

## Verificación visual pendiente

La suite valida comportamiento y recursos estáticos. Para evaluar la sensación de movimiento, abrir una partida en computadora y celular, probar toques rápidos y movimiento reducido, y revisar las transiciones a velocidad lenta con las herramientas de animación del navegador. No instalar herramientas adicionales para esta revisión sin autorización.
