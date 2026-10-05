# 🌿 Sabana · Aventura de supervivencia

Juego educativo multijugador en español, con Express y Socket.IO. Incluye presentador, salas con código único, doce situaciones, decisiones individuales, recursos, puntuación y clasificación final. Interfaz adaptable a computadoras y celulares.

## Ejecutar en Windows, macOS o Linux

Necesitas Node.js 18 o posterior y npm.

```sh
npm install
npm start
```

- Inicio y jugadores: http://localhost:3000
- Presentador: http://localhost:3000/host
- Jugadores: http://localhost:3000/player
- Desarrollo con reinicio automático: `npm run dev`
- Pruebas automatizadas: `npm test`

En PowerShell, si la política de ejecución impide usar `npm`, utiliza `npm.cmd`.
Puedes configurar el puerto con la variable de entorno `PORT` (por defecto 3000).

## Cómo jugar

### Interfaz directa y animada

La entrada se concentra en código, nombre y una fila de animales. También se admiten solo los seis dígitos del código. El presentador crea e inicia la sala con un botón en cada paso.

Las respuestas utilizan tarjetas grandes de colores con símbolos distintos; en computadora también puedes usar las teclas **1, 2 y 3**. Incluye aparición de participantes, transiciones entre rondas, temporizador animado, confirmación de respuesta, puntos, confeti y podio final. Los cambios en tiempo real mantienen el foco y no reinician la pantalla de preguntas. Si tu sistema tiene activada la preferencia de movimiento reducido, se mantienen desvanecimientos breves y se desactivan los desplazamientos y el confeti.

### Skills del proyecto

`opencode.json` vincula la colección local de skills de `C:/Users/hu250/.agents/skills`. No se instalan ni se copian archivos de esa colección. Reinicia OpenCode y abre esta carpeta como proyecto para que detecte la configuración. Si usas otro equipo, ajusta la ruta.

`AGENTS.md` establece cómo seleccionar las skills según la tarea, mantener el flujo minimalista y trabajar sin instalaciones adicionales. Las decisiones de diseño y movimiento están en `docs/design-decisions.md`. La disponibilidad de una skill no implica aplicar sus instrucciones a tareas ajenas a su propósito.

1. El presentador abre `/host`, crea una sala y comparte el código o el enlace del botón **Copiar invitación**.
2. Cada participante abre `/player`, escribe el código y un nombre único, y elige uno de los seis animales.
3. La lista de participantes y su conexión se actualizan en tiempo real. El presentador inicia con al menos un jugador conectado.
4. Cada situación dura hasta 30 segundos. Solo se admite una respuesta por jugador. Cuando todos los jugadores activos responden, la ronda termina anticipadamente.
5. Se muestran consecuencias, explicación educativa y clasificación. El presentador avanza a la siguiente situación.
6. Tras doce situaciones, o cuando nadie conserva recursos, aparece la clasificación final.

### Reglas

- Agua, energía y supervivencia empiezan en **70** y están limitadas a **0–100**.
- Cada opción tiene efectos y puntos base definidos en `server/situations.js`.
- Se añaden **50 puntos por sobrevivir a cada ronda**. No hay bonificación por velocidad.
- No responder cuesta 15 de agua, 15 de energía y 10 de supervivencia, sin puntos base.
- Si cualquier recurso llega a 0, el participante se convierte en espectador y conserva su puntuación.
- Orden de clasificación: puntos, rondas sobrevividas, supervivencia restante y nombre.
- Los animales son avatares de una expedición humana. Los recursos son una simplificación educativa; las explicaciones se muestran después de responder.

## Reconexión y uso desde celulares

Socket.IO reintenta automáticamente la conexión. Las credenciales se guardan en `sessionStorage`, de forma independiente por rol y pestaña: puedes probar varios jugadores en distintas pestañas del mismo navegador. Recargar la misma pestaña recupera sala, identidad, respuestas y recursos. Una pestaña nueva no recupera automáticamente una sesión cerrada; la restauración de pestañas depende del navegador.

El temporizador y los resultados se calculan en el servidor. La ronda en curso continúa si se pierde la conexión del presentador; la siguiente espera a que vuelva. Los jugadores desconectados conservan su plaza y reciben la penalización si no respondieron antes de agotarse el tiempo.

Para jugar en la misma red wifi:

1. Ejecuta `ipconfig` en Windows y busca la dirección IPv4 de tu adaptador wifi.
2. Abre, por ejemplo, `http://192.168.1.20:3000/host` en el presentador y `http://192.168.1.20:3000/player` en los celulares.
3. Si Windows pregunta, permite Node.js en tu red privada. Genera la invitación desde esa dirección, porque `localhost` solo funciona en el equipo servidor.

Para jugar por Internet, aloja el servidor Node.js en un servicio que soporte conexiones persistentes y WebSockets; sirve el sitio con HTTPS. Esta versión funciona como una sola instancia: las salas viven en memoria y se pierden al reiniciar el servidor. Las salas sin conexiones se eliminan después de seis horas. Límite: 100 jugadores por sala y 500 salas por instancia.

## Publicar en GitHub Pages

**GitHub Pages publica la interfaz. El servidor multijugador se ejecuta por separado** en Render u otro alojamiento Node.js con WebSockets. Subir solo la interfaz no permite crear salas sin ese servidor.

### 1. Subir el proyecto a GitHub

Crea un repositorio y sube los archivos del proyecto, incluyendo `.github/workflows/pages.yml`, `scripts/` y `render.yaml`. No subas `node_modules/` ni `dist/`. El workflow utiliza la rama `main`; si usas otra, cambia `branches` en el archivo del workflow.

### 2. Crear el servidor en Render

1. En Render, crea un **Blueprint** conectado al repositorio. Detectará `render.yaml`. También puedes crear un Web Service Node.js manualmente: instalación `npm ci --omit=dev`, inicio `npm start`, health check `/health`.
2. Configura **ALLOWED_ORIGINS** con el origen de tu página: `https://TU_USUARIO.github.io` (sin el nombre del repositorio ni barra final). Para varios orígenes, sepáralos por comas. Si tienes un dominio personalizado, incluye ese origen.
3. Espera a que el servicio esté disponible y copia su URL, por ejemplo `https://sabana-multijugador.onrender.com`.
4. Abre `https://sabana-multijugador.onrender.com/health`: debe responder `{"status":"ok"}`.

El plan gratuito puede suspenderse por inactividad y tardar en despertar; la interfaz reintenta la conexión. Un reinicio o suspensión pierde las salas en memoria. Para sesiones continuas, utiliza un servicio que permanezca activo y una sola instancia.

### 3. Activar Pages y configurar la conexión

En el repositorio de GitHub:

1. **Settings → Pages → Build and deployment → Source:** selecciona **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables → New repository variable (recomendado):**
   - Nombre: `SABANA_SERVER_URL`
   - Valor: la URL HTTPS de Render, por ejemplo `https://sabana-multijugador.onrender.com`.
   - Es una URL pública, no un secreto. Usa solo el origen, sin rutas ni parámetros.
   
   Si no creas esta variable, el workflow usa `https://sabana-multijugador.onrender.com` como valor predeterminado. Si tu servicio tiene otra URL, debes crear la variable para que la interfaz se conecte al servidor correcto.
3. Ve a **Actions → Deploy GitHub Pages → Run workflow**, o realiza un push a `main`.

El workflow instala dependencias, ejecuta las pruebas, genera `dist/` con el cliente Socket.IO incluido y publica el sitio. La primera ejecución puede requerir habilitar **Settings → Pages → Source: GitHub Actions** y conceder permisos de Pages si GitHub lo solicita.

### 4. Enlaces del juego publicado

Para un repositorio llamado `sabana`:

- Jugadores: `https://TU_USUARIO.github.io/sabana/`
- Presentador: `https://TU_USUARIO.github.io/sabana/?role=host`
- Invitación: `https://TU_USUARIO.github.io/sabana/?role=player&code=SABANA-123456`

Usa estos enlaces en Pages: las rutas `/host` y `/player` corresponden al servidor Node.js local. La navegación utiliza parámetros de URL para poder recargar sin errores 404. Los recursos y las invitaciones conservan la subcarpeta del repositorio; también funciona en la raíz de un dominio personalizado.

### Generar la versión estática localmente

```powershell
$env:SABANA_SERVER_URL = "https://sabana-multijugador.onrender.com"
npm.cmd run build:pages
```

Publica el contenido de `dist/`, no la carpeta `public/` directamente. Si pruebas `dist/` con un servidor estático local, añade también su origen (por ejemplo `http://localhost:8080`) a `ALLOWED_ORIGINS` del backend. El modo local habitual con `npm start` sigue funcionando sin configurar estas variables.

Si aparece “Sin conexión”, comprueba que `/health` responde, que `SABANA_SERVER_URL` es correcto y que `ALLOWED_ORIGINS` contiene el origen exacto de Pages. Después de cambiar la variable de GitHub, vuelve a ejecutar el workflow.

## Estructura

```text
server/index.js        Servidor, sesiones, validación, rondas y puntuación
server/situations.js   Contenido educativo y consecuencias
public/index.html     Documento de la aplicación
public/app.js         Interfaz y conexión en tiempo real
public/styles.css     Diseño adaptable
public/config.js      Configuración del servidor (local por defecto)
scripts/build-pages.js Generación de la web estática para Pages
.github/workflows/pages.yml Despliegue automático en GitHub Pages
render.yaml           Configuración del servidor externo en Render
test/game.test.js     Pruebas de integración con clientes Socket.IO reales
```

Las credenciales no se incluyen en las listas públicas. El servidor valida el rol del presentador, el animal, el nombre, la ronda, la respuesta y el plazo. Las consecuencias se revelan al terminar cada ronda. Las fuentes de Google son opcionales: si no cargan, se usan las fuentes del sistema.
