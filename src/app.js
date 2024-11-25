import express from 'express';
import { create } from 'express-handlebars';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import viewsRouter from './routes/views.router.js';
import cartsRouter from './routes/carts.js';
import productsRouter, { getProducts } from './routes/products.js';
import { fileURLToPath } from 'url';
import { conectaDB } from './utils.js'; 
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

const hbs = create({
  extname: '.handlebars',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

(async () => {
  try {
    await conectaDB();
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1); 
  }
})();

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/', viewsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/products', productsRouter);

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('getProducts', async () => {
    try {
      const products = await getProducts();
      console.log('Productos enviados al cliente:', products); 
      socket.emit('initialProducts', products); 
    } catch (error) {
      console.error('Error al obtener productos:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
