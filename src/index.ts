import app from "./app.js";
import { loadDemoData } from "./services/demo.service.js";

const PORT = process.env.PORT || 3000;

// Carga los jugadores y personajes de prueba antes de recibir peticiones.
loadDemoData();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("Jugadores de prueba: camilo / camilo123, andrea / andrea123, luis / luis123");
});
