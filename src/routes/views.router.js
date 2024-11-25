import express from 'express';
import { getProducts, getProductById } from './products.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index'); 
});

router.get('/home', async (req, res) => {
  try {
    const products = await getProducts(); 
    res.render('home', { products }); 
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar la lista de productos' });
  }
});
router.get('/products/:pid', async (req, res) => {
  try {
      const product = await getProductById(req.params.pid);
      if (!product) {
          return res.status(404).render('error', { message: 'Producto no encontrado' });
      }
      res.render('productDetails', { product });
  } catch (error) {
      res.status(500).json({ error: 'Error al cargar los detalles del producto' });
  }
});
export default router;
