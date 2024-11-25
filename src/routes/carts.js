import express from 'express';
import Cart from '../models/cart.js';
import Product from '../models/product.js'; 
import { addToCart } from '../models/cart.js'; 
import { getCart } from '../controllers/cartController.js'; 
import mongoose from 'mongoose';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const newCart = new Cart({ products: [] });
    await newCart.save();

    try {
      req.app.get('io').emit('newCart', newCart);
    } catch (emitError) {
      console.warn('Error emitiendo evento WebSocket:', emitError);
    }

    res.status(201).json(newCart);
  } catch (error) {
    console.error('Error al crear el carrito:', error);
    res.status(500).json({ error: 'Error al crear el carrito', details: error.message });
  }
});


router.get('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product');
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    res.json(cart.products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el carrito', details: error.message });
  }
});

router.get('/carts/:cid', getCart);

router.post('/carts/add/:productId', addToCart);

router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const product = await Product.findById(req.params.pid);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const productInCart = cart.products.find(p => p.product.toString() === req.params.pid);
    if (productInCart) {
      productInCart.quantity += 1; 
    } else {
      cart.products.push({ product: req.params.pid, quantity: 1 });
    }

    await cart.save();

    try {
      req.app.get('io').emit('productAdded', { cartId: req.params.cid, product: { id: req.params.pid, quantity: 1 } });
    } catch (emitError) {
      console.warn('Error emitiendo evento WebSocket:', emitError);
    }

    res.json(cart);
  } catch (error) {
    console.error('Error al agregar el producto al carrito:', error);
    res.status(500).json({ error: 'Error al agregar el producto al carrito', details: error.message });
  }
});


router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

  
    cart.products = cart.products.filter(item => item.product.toString() !== req.params.pid);
    await cart.save();

   
    res.json({ message: 'Producto eliminado del carrito', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto del carrito', details: error.message });
  }
});

router.put('/:cid', async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'El formato de productos debe ser un array' });
  }

  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const validProducts = [];

    for (const product of products) {
      const { product: productId, quantity } = product;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: `ID de producto inválido: ${productId}` });
      }

      const foundProduct = await Product.findById(productId);
      if (!foundProduct) {
        return res.status(404).json({ error: `Producto no encontrado: ${productId}` });
      }

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para el producto: ${productId}` });
      }

      if (validProducts.some(p => p.product.toString() === productId)) {
        return res.status(400).json({ error: `Producto duplicado: ${productId}` });
      }

      validProducts.push({ product: productId, quantity });
    }

    cart.products = validProducts;
    await cart.save();

    res.json({ message: 'Carrito actualizado', cart });
  } catch (error) {
    console.error('Error al actualizar el carrito:', error);
    res.status(500).json({ error: 'Error al actualizar el carrito', details: error.message });
  }
});


router.put('/:cid/products/:pid', async (req, res) => {
  const { quantity } = req.body;
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }

    const productInCart = cart.products.find(p => p.product.toString() === req.params.pid);
    if (!productInCart) {
      return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
    }

    productInCart.quantity = quantity;
    await cart.save();

    res.json({ message: 'Cantidad actualizada', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cantidad', details: error.message });
  }
});

router.delete('/:cid', async (req, res) => {
  try {
    const cart = await Cart.findByIdAndUpdate(
      req.params.cid,
      { products: [] },
      { new: true }
    );
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    res.json({ message: 'Todos los productos eliminados del carrito', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar productos del carrito', details: error.message });
  }
});

router.post('/add/:pid', async (req, res) => {
  try {
      const productId = req.params.pid; 
      const updatedCart = await addToCart(productId); 

      res.json({ message: 'Producto agregado al carrito', cart: updatedCart });
  } catch (error) {
      res.status(500).json({ error: 'Error al agregar al carrito', details: error.message });
  }
});

export default router;
