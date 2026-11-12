import app from "./app.js";
import { loadDemoData } from "./services/demo.service.js";

const PORT = process.env.PORT || 3000;

// Carga los jugadores y personajes de prueba antes de recibir peticiones.
loadDemoData();

app.listen(PORT, (error) => {
  // En Express 5 esta función también se llama cuando no se pudo abrir el puerto.
  if (error) {
    console.error(`No se pudo iniciar el servidor en el puerto ${PORT}: ${error.message}`);
    console.error("Seguramente otro servidor ya está usando ese puerto. Ciérralo (Ctrl + C en su terminal) y vuelve a ejecutar npm run dev.");
    process.exit(1);
  }

  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("Jugadores de prueba: camilo / camilo123, andrea / andrea123, luis / luis123");
});
