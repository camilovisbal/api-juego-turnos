# API para videojuego por turnos

Proyecto para Desarrollo Web. Es una API REST para un juego de combate por turnos. Los jugadores se registran, crean personajes (guerrero, mago o arquero), arman un equipo y pelean contra otro jugador o contra enemigos que maneja el servidor. En cada turno el jugador elige una acción y el servidor revisa que se pueda hacer, calcula el resultado, cambia el turno y decide quién gana.

No tiene interfaz gráfica: se prueba con el archivo `requests.http` (extensión REST Client de VS Code) o con la colección de Postman que está en el repositorio.

## Funcionalidades

- Registro de jugadores e inicio de sesión con token
- Las contraseñas se guardan con hash (scrypt), nunca en texto plano, y nunca aparecen en las respuestas
- Consultar los jugadores, ver el perfil propio y editarlo (nombre, correo y contraseña)
- Estadísticas de cada jugador: partidas jugadas, victorias, derrotas, porcentaje de victorias, resultados contra jugadores y contra el sistema
- CRUD de personajes con tres clases que tienen estadísticas distintas
- Las estadísticas se pueden ajustar pero solo dentro de los límites de la clase (no se puede crear un personaje con 9999 de ataque)
- Un jugador solo puede editar o eliminar sus propios personajes y su propio perfil
- Crear partidas contra otro jugador (abiertas o invitando a alguien) o contra el sistema
- Equipos de 1 a 3 personajes. Pelean uno contra uno y cuando uno cae entra el siguiente
- Cuatro acciones por turno: atacar, defender, habilidad especial y curar
- Habilidad especial distinta para cada clase, con enfriamiento
- El servidor valida el turno, las reglas de cada acción y decide el ganador
- Contra el sistema, el enemigo responde solo en la misma petición
- Historial de cada partida con un mensaje por acción
- Cancelar una partida que nadie se ha unido y rendirse en una partida en curso
- Al terminar se suman victorias, derrotas y experiencia; los personajes suben de nivel
- Jugadores y personajes de prueba, y una ruta para reiniciarlos

## Tecnologías

- Node.js
- Express 5
- TypeScript (se ejecuta con tsx)
- El módulo `crypto` que ya trae Node: `scrypt` para las contraseñas y `randomUUID` para los tokens

No se usaron más librerías: ni bcrypt ni jsonwebtoken, porque `crypto` ya trae lo necesario. No hay base de datos: todo se guarda en la memoria del servidor.

## Cómo ejecutarlo

Primero hay que tener instalado Node.js (versión LTS).

1. Clonar el repositorio:

```bash
git clone https://github.com/camilovisbal/api-juego-turnos.git
```

2. Entrar a la carpeta e instalar las dependencias:

```bash
cd api-juego-turnos
npm install
```

3. Ejecutar el servidor:

```bash
npm run dev
```

Debe aparecer `Servidor corriendo en http://localhost:3000`. Con `npm run dev` el servidor se reinicia solo cuando se guarda un cambio.

Otros comandos:

- `npm start`: ejecuta el servidor sin reiniciarse con los cambios.
- `npm run typecheck`: revisa los tipos de TypeScript sin generar archivos (`tsc --noEmit`).
- `npm run build`: compila a JavaScript en la carpeta `dist`.

## Cómo probarlo

- **REST Client:** instalar la extensión REST Client en VS Code, abrir `requests.http` y hacer clic en "Send Request" sobre cada petición, en orden de arriba hacia abajo. Los tokens y los ids se guardan solos en variables cuando se ejecuta el login o la creación.
- **Postman o Thunder Client:** importar `postman_collection.json` y ejecutar las peticiones en orden (o con el Runner). Cada petición revisa el código de respuesta esperado y guarda los tokens e ids en variables de la colección.

Las pruebas van desde el registro hasta ganar una partida contra otro jugador, una partida contra el sistema, cancelar, rendirse y los errores (sin token, turno equivocado, personaje ajeno, curarse con la vida llena, acción en una partida finalizada, etc.). La primera petición reinicia los datos para que siempre den el mismo resultado.

## Usuarios de prueba

Se cargan al encender el servidor y con `POST /api/demo/reset`.

| Usuario | Contraseña | Personajes |
|---|---|---|
| camilo | camilo123 | Thorin (guerrero, id 1), Lyra (arquero, id 2) |
| andrea | andrea123 | Merlín (mago, id 3), Aria (arquero, id 4) |
| luis | luis123 | Grom (guerrero, id 5), Zafira (mago, id 6) |

## Endpoints

La dirección base es `http://localhost:3000`. Todas las respuestas son JSON. Las rutas con "Sí" en la columna Token necesitan el header:

```
Authorization: Bearer <token que devuelve el login>
```

### Jugadores

| Método | Ruta | Token | Qué hace | Respuestas |
|---|---|---|---|---|
| POST | `/api/register` | No | Registra un jugador | 201, 400, 409 |
| POST | `/api/login` | No | Inicia sesión y devuelve el token | 200, 400, 401 |
| POST | `/api/logout` | Sí | Cierra la sesión (el token deja de servir) | 204, 401 |
| GET | `/api/players` | Sí | Lista los jugadores | 200 |
| GET | `/api/players/:id` | Sí | Información de un jugador. También sirve `/api/players/me` | 200, 400, 404 |
| PUT | `/api/players/:id` | Sí | Actualiza el perfil. También sirve `/api/players/me` | 200, 400, 403, 404, 409 |
| GET | `/api/players/:id/statistics` | Sí | Estadísticas de victorias y derrotas | 200, 404 |

### Personajes

| Método | Ruta | Token | Qué hace | Respuestas |
|---|---|---|---|---|
| GET | `/api/classes` | Sí | Las clases con sus estadísticas, límites y habilidad | 200 |
| GET | `/api/characters` | Sí | Lista los personajes. Filtros: `?playerId=1` y `?class=mago` | 200, 400, 404 |
| GET | `/api/characters/:id` | Sí | Consulta un personaje | 200, 400, 404 |
| POST | `/api/characters` | Sí | Crea un personaje | 201, 400, 409 |
| PUT | `/api/characters/:id` | Sí | Actualiza un personaje propio | 200, 400, 403, 404, 409 |
| DELETE | `/api/characters/:id` | Sí | Elimina un personaje propio | 204, 403, 404, 409 |

### Partidas

| Método | Ruta | Token | Qué hace | Respuestas |
|---|---|---|---|---|
| POST | `/api/games` | Sí | Crea una partida | 201, 400, 403, 404, 409 |
| GET | `/api/games` | Sí | Lista las partidas. Filtros: `?status=Pendiente`, `?mine=true`, `?available=true` | 200, 400 |
| GET | `/api/games/:id` | Sí | Estado de la partida: equipos, vida, turno y ganador | 200, 404 |
| POST | `/api/games/:id/join` | Sí | Unirse a una partida pendiente | 200, 400, 403, 404, 409 |
| POST | `/api/games/:id/actions` | Sí | Ejecuta la acción del turno | 200, 400, 403, 404, 409 |
| GET | `/api/games/:id/history` | Sí | Historial de la partida | 200, 404 |
| POST | `/api/games/:id/finish` | Sí | Finaliza la partida: quien la pide se rinde | 200, 403, 404, 409 |
| POST | `/api/games/:id/cancel` | Sí | Cancela una partida pendiente (solo el creador) | 200, 403, 404, 409 |

### Otros

| Método | Ruta | Token | Qué hace |
|---|---|---|---|
| GET | `/` | No | Muestra que el API funciona y la lista de rutas |
| POST | `/api/demo/reset` | No | Borra todo y vuelve a cargar los usuarios de prueba (solo para demostraciones) |

`?available=true` devuelve las partidas pendientes a las que el jugador se puede unir: que no creó él y que están abiertas o lo invitaron a él. `?mine=true` devuelve las partidas donde juega.

### Ejemplos de body

Registrar (`name` es opcional, si no viene se usa el usuario):

```json
{ "username": "sofia", "name": "Sofía", "email": "sofia@juego.com", "password": "sofia123" }
```

Iniciar sesión:

```json
{ "username": "camilo", "password": "camilo123" }
```

Respuesta del login:

```json
{
  "mensaje": "Bienvenido, Camilo.",
  "token": "0b6b1f0e-5f7e-4a3e-9d0a-6a0f2c1d9e11",
  "expiresAt": "2026-11-12T20:00:00.000Z",
  "player": { "id": 1, "username": "camilo", "name": "Camilo", "email": "camilo@juego.com", "wins": 0, "losses": 0 }
}
```

Actualizar el perfil (todo es opcional; para cambiar la contraseña hay que enviar la actual):

```json
{ "name": "Camilo V.", "password": "nueva123", "currentPassword": "camilo123" }
```

Crear un personaje (las estadísticas son opcionales, las que no vengan toman el valor por defecto de la clase):

```json
{ "name": "Kael", "class": "arquero", "attack": 20, "defense": 4 }
```

Actualizar un personaje (se cambia solo lo que venga; si cambia la clase, las estadísticas que no se envíen vuelven a los valores de la nueva clase):

```json
{ "name": "Kael el Rápido", "speed": 17 }
```

Crear una partida contra otro jugador, invitando al jugador 2 (sin `invitedPlayerId` queda abierta para cualquiera):

```json
{ "characterIds": [1, 2], "mode": "jugador", "invitedPlayerId": 2 }
```

Crear una partida contra el sistema:

```json
{ "characterIds": [1], "mode": "sistema" }
```

Unirse a una partida (hay que llevar la misma cantidad de personajes que el creador):

```json
{ "characterIds": [3, 4] }
```

Ejecutar una acción (`atacar`, `defender`, `habilidad` o `curar`):

```json
{ "action": "atacar" }
```

La respuesta de una acción trae lo que pasó en ese turno y el estado de la partida:

```json
{
  "events": [
    { "turn": 6, "type": "accion", "player": "Camilo", "actor": "Thorin", "action": "atacar", "target": "Merlín", "damage": 14, "targetHealth": 26, "actorHealth": 38, "message": "Thorin atacó a Merlín e hizo 14 de daño." }
  ],
  "game": { "id": 1, "status": "En curso", "turn": 7, "turnOf": "opponent", "turnOfPlayer": "Andrea", "creator": { ... }, "opponent": { ... } }
}
```

### Errores

Cuando algo falla la respuesta tiene un campo `error` con el mensaje en español. En las validaciones también viene `errors` con el error de cada campo:

```json
{ "error": "Hay datos inválidos en el personaje.", "errors": { "attack": "El ataque de un mago de nivel 1 debe estar entre 19 y 25." } }
```

| Código | Cuándo |
|---|---|
| 200 | Todo bien |
| 201 | Se creó un jugador, personaje o partida |
| 204 | Se eliminó un personaje o se cerró la sesión (sin contenido) |
| 400 | Datos inválidos en el body, id que no es número o JSON mal escrito |
| 401 | Falta el token, el token no existe o venció, o usuario y contraseña incorrectos |
| 403 | El recurso es de otro jugador (personaje, perfil, partida a la que no lo invitaron) |
| 404 | No existe el jugador, personaje, partida o ruta |
| 409 | Se rompe una regla del juego: no es tu turno, la partida no está en curso, habilidad en enfriamiento, vida llena, personaje que ya está jugando, usuario repetido... |
| 500 | Error inesperado del servidor |

## Reglas del juego

### Clases

Valores de nivel 1. Entre paréntesis el mínimo y el máximo que se pueden elegir al crear o editar el personaje.

| Clase | Vida | Ataque | Defensa | Velocidad | Habilidad especial |
|---|---|---|---|---|---|
| guerrero | 80 (70-90) | 16 (14-18) | 10 (8-12) | 8 (6-10) | Golpe demoledor |
| mago | 60 (50-70) | 22 (19-25) | 4 (2-6) | 10 (8-12) | Bola de fuego |
| arquero | 65 (55-75) | 18 (16-20) | 6 (4-8) | 15 (13-17) | Doble disparo |

- El guerrero tiene mucha vida y defensa, el mago el ataque más alto y el arquero la velocidad más alta.
- Todos los personajes empiezan en nivel 1 (máximo 10). El nivel no se puede elegir, sube ganando experiencia.
- Por cada nivel suben las estadísticas y también sus límites: el guerrero gana 8 de vida, 2 de ataque, 2 de defensa y 1 de velocidad; el mago 6, 3, 1 y 1; el arquero 6, 2, 1 y 2.
- Cada jugador puede tener hasta 6 personajes y no puede repetir el nombre.

### Fórmulas

| Acción | Qué hace |
|---|---|
| Atacar | Daño = `ataque - defensa del rival / 2` (redondeado hacia abajo). Mínimo 1 |
| Defender | El próximo daño que reciba el personaje se reduce a la mitad. Dura hasta que vuelve a actuar |
| Habilidad | Guerrero: `ataque x 1.25` sin contar la defensa del rival. Mago: `ataque x 1.8 - defensa del rival / 2`. Arquero: dos ataques normales seguidos |
| Curar | Recupera el 30% de la vida máxima, sin pasar nunca del máximo. Cada personaje tiene 2 curaciones por partida |

- Después de usar la habilidad hay que esperar 2 turnos propios para volver a usarla (se puede usar una vez cada 3 turnos).
- Si el rival se defendió, la habilidad también hace la mitad (en el doble disparo, cada flecha hace la mitad).

Ejemplo: Thorin (guerrero, ataque 16) ataca a Merlín (mago, defensa 4): `16 - 4/2 = 14` de daño. Si Merlín se defendió: `14 / 2 = 7`.

### Reglas del combate

- Solo puede jugar el jugador que tiene el turno. Si otro lo intenta, el servidor responde `409`.
- Solo se puede hacer una acción por turno: después de cada acción válida el turno pasa al rival, así que una segunda acción seguida también da `409`.
- Una acción que rompe una regla (habilidad en enfriamiento, curarse con la vida llena o sin curaciones) responde `409` y no gasta el turno.
- Un personaje derrotado no puede actuar.
- La vida nunca baja de 0 ni pasa de la vida máxima.
- Si la vida llega a 0 el personaje queda derrotado y entra el siguiente personaje vivo del equipo.
- Gana el jugador que deja al rival sin personajes vivos. El servidor lo decide solo y marca la partida como Finalizada.
- No se pueden hacer acciones en una partida que no esté En curso.

### Estados de una partida

| Estado | Cuándo |
|---|---|
| Pendiente | Se creó contra otro jugador y está esperando que alguien se una |
| En curso | Alguien se unió, o es contra el sistema (empieza apenas se crea) |
| Finalizada | Hay un ganador, porque el rival se quedó sin personajes o porque se rindió |
| Cancelada | El creador la canceló antes de que alguien se uniera |

### Quién empieza

Empieza el jugador cuyo primer personaje tenga más velocidad. Si empatan, empieza quien creó la partida. El mensaje de inicio en el historial dice por qué empezó cada uno.

### Contra el sistema

El servidor arma un equipo con un enemigo por cada personaje del jugador, del mismo nivel, con el valor mínimo de cada estadística de su clase (para que se le pueda ganar). Hay tres enemigos: Orco Bruto (guerrero), Bruja del Pantano (mago) y Arquero Esqueleto (arquero).

Después de cada acción del jugador, el sistema juega en la misma petición con una regla simple:

1. Si le queda el 35% de la vida o menos y tiene curaciones, se cura.
2. Si su habilidad está lista, la usa.
3. Si no, ataca.

Las dos acciones quedan en el historial.

### Al terminar la partida

- El ganador suma una victoria y el perdedor una derrota (el sistema no tiene estadísticas).
- Los personajes del ganador ganan 50 de experiencia y los del perdedor 20. Cada 100 de experiencia el personaje sube un nivel y sus estadísticas suben según su clase.
- Si alguien se rinde con `/finish`, pierde y la victoria es para el rival.

## Estructura del proyecto

```
src/
├── index.ts               carga los datos de prueba y arranca el servidor en el puerto 3000
├── app.ts                 configura Express, el logger, las rutas, el token y los errores
├── types.ts               tipos de TypeScript (Player, Character, Game, Fighter, HistoryEntry...)
├── routes/                las rutas de cada recurso (auth, players, characters, classes, games, demo)
├── controllers/           reciben la petición, validan el body y responden con el código HTTP
├── services/
│   ├── auth.service.ts        tokens en memoria
│   ├── players.service.ts     jugadores, victorias y derrotas
│   ├── characters.service.ts  personajes y experiencia
│   ├── games.service.ts       crear, unirse, cancelar, rendirse y estadísticas
│   ├── combat.service.ts      turnos, acciones, enemigos del sistema y ganador
│   └── demo.service.ts        carga los datos de prueba
├── data/                  clases con sus estadísticas, enemigos del sistema y datos de prueba
├── middlewares/           logger, token (auth.ts) y manejo de errores
└── utils/                 validaciones, fórmulas del combate, hash de contraseñas y HttpError
requests.http              pruebas para REST Client
postman_collection.json    las mismas pruebas para Postman o Thunder Client
```

## Cómo funciona

### Capas

Está separado por capas: la ruta recibe la petición, el controlador revisa los datos y decide qué código HTTP responder, y el servicio guarda o cambia los datos. Las validaciones de los body están en `utils/` (`validatePlayer.ts`, `validateCharacter.ts` y `validateGame.ts`) y devuelven el error de cada campo.

Las reglas del juego están en los servicios. Cuando una regla no se cumple, el servicio lanza un `HttpError` con el código (por ejemplo `409` si no es tu turno) y el middleware de `middlewares/errors.ts` lo convierte en la respuesta JSON. Así no hay que repetir el `res.status(...).json(...)` en cada regla: Express pasa al middleware de errores cualquier error que se lance dentro de una ruta.

### Autenticación con tokens en memoria

Al iniciar sesión el servidor crea un token con `crypto.randomUUID()` y lo guarda en un `Map` junto con el id del jugador y la fecha en que vence (8 horas). El middleware `requireAuth` lee el header `Authorization: Bearer <token>`, busca el token en el `Map` y guarda el jugador en `res.locals.player`, así los controladores saben quién hizo la petición. Si no hay token, no existe o venció, responde `401`.

Se usaron tokens en memoria y no JWT porque los datos ya viven en memoria, no hace falta otra librería y se puede cerrar sesión de verdad: `POST /api/logout` borra el token del `Map` y deja de servir. La desventaja es que si se reinicia el servidor hay que volver a iniciar sesión, pero eso también pasa con todos los datos porque no hay base de datos.

### Contraseñas con scrypt

La contraseña no se guarda. En el registro se genera una sal aleatoria de 16 bytes y se calcula `scrypt(contraseña, sal)`. Se guardan el hash y la sal. En el login se vuelve a calcular el hash con la misma sal y se compara con `timingSafeEqual`, que tarda lo mismo sin importar en qué carácter fallen. La sal hace que dos jugadores con la misma contraseña tengan hashes distintos. Se usó `scrypt` porque viene en el módulo `crypto` de Node y está hecho para contraseñas: es lento a propósito, lo que hace muy costoso probar millones de contraseñas. El hash y la sal se quitan con `toPublic()` antes de responder.

Si el usuario no existe o la contraseña está mal, el login responde el mismo mensaje para no dar pistas de qué usuarios están registrados.

### Personajes dentro de la partida

Cuando un personaje entra a una partida se hace una copia (`Fighter`) con su vida, ataque, defensa y velocidad, más los datos del combate: si se está defendiendo, cuántos turnos le faltan a la habilidad, cuántas curaciones le quedan y si está derrotado. Se copia para que la vida que pierde en el combate no cambie al personaje guardado y para que, si después se edita el personaje, las partidas viejas no cambien. Mientras un personaje está en una partida pendiente o en curso no se puede editar, eliminar ni meter en otra partida (`409`).

### Cómo se decide el turno

La partida guarda `turnOf`, que es `"creator"` o `"opponent"`. Al empezar se comparan las velocidades de los primeros personajes de cada equipo. En `POST /api/games/:id/actions` el servidor revisa en este orden:

1. Que la partida esté En curso (si no, `409`).
2. Que el jugador juegue en la partida (si no, `403`).
3. Que sea su turno (si no, `409`).
4. Las reglas de la acción: que el personaje no esté derrotado, que la habilidad no esté en enfriamiento y que pueda curarse (si no, `409`).

Estas revisiones se hacen antes de cambiar nada, así si una falla la partida queda igual. Si todo está bien se aplica la acción, se guarda en el historial, sube el número de turno y `turnOf` pasa al otro equipo. Contra el sistema, después de cambiar el turno el servidor juega el turno del enemigo antes de responder.

### Cómo se decide el ganador

Cada vez que un personaje recibe daño se revisa su vida. Si llega a 0 queda derrotado y se busca el siguiente personaje vivo de su equipo con `find()`. Si no queda ninguno, `finishGame()` marca la partida como Finalizada, guarda el ganador, suma la victoria y la derrota a cada jugador y reparte la experiencia. Todo pasa dentro de la misma petición, el cliente no tiene que avisar que la partida terminó.

### Historial

Cada partida guarda una lista con todo lo que pasa: las acciones (con turno, jugador, personaje, acción, daño o curación, vida resultante y un mensaje como "Thorin atacó a Merlín e hizo 14 de daño.") y los eventos (quién creó la partida, quién se unió, quién empezó, quién quedó fuera de combate, quién ganó y quién subió de nivel).

## Limitaciones

- No hay base de datos: si se apaga o se reinicia el servidor se pierde todo y vuelven a quedar solo los usuarios de prueba.
- Los tokens también se pierden al reiniciar el servidor.
- `POST /api/demo/reset` no pide token porque es solo para las demostraciones. En un juego real no debería existir.
- El sistema decide con una regla fija, no es una inteligencia difícil de vencer.

## Autor

Camilo Andrés Visbal Beltrán
Ingeniería de Sistemas - Universidad de la Costa (CUC)
