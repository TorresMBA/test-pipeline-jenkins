import express from 'express';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware obligatorio para parsear bodies en JSON
app.use(express.json());

// Endpoint de prueba (Health check)
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', uptime: process.uptime() });
});

// Endpoint REST básico
app.get('/api/saludo', (req, res) => {
	res.json({ mensaje: '¡Servidor funcionando correctamente | He sido modificado!' });
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Servidor activo en http://0.0.0.0:${PORT}`);
});
