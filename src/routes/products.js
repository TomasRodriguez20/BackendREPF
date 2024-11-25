import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/product.js'; 
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFile = path.join(__dirname, '../data/productos.json');

export const getProducts = async () => {
  try {
    const products = await Product.find();
    console.log('Productos cargados desde la base de datos:', products);
    return products;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error; 
  }
};

export const getProductById = async (id) => {
  try {
      return await Product.findById(id).lean(); 
  } catch (error) {
      console.error('Error al obtener el producto:', error);
      return null;
  }
};

export const saveProducts = async (products) => {
  await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
};
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category'); 
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort = '', query = '', category = '', stock = '' } = req.query;

    const filter = {};

    if (category) {
      filter.category = category.toLowerCase(); 
    }

    if (query) {
      filter.title = { $regex: query, $options: 'i' }; 
    }

    if (stock) {
      if (stock === 'disponible') {
        filter.stock = { $gt: 0 }; 
      } else if (stock === 'agotado') {
        filter.stock = 0; 
      }
    }

    const sortOption = {};
    if (sort) {
      sortOption.price = sort === 'asc' ? 1 : -1; 
    }

    const skip = (parseInt(page) - 1) * parseInt(limit); 
    const products = await Product.find(filter) 
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      status: 'success',
      payload: products,
      totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? parseInt(page) + 1 : null,
      page: parseInt(page),
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevLink: page > 1 ? `/api/products?limit=${limit}&page=${page - 1}&sort=${sort}&query=${query}&category=${category}&stock=${stock}` : null,
      nextLink: page < totalPages ? `/api/products?limit=${limit}&page=${parseInt(page) + 1}&sort=${sort}&query=${query}&category=${category}&stock=${stock}` : null
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});





router.get('/:pid', async (req, res) => {
  try {
    const products = await getProducts();
    const product = products.find(p => p.id === req.params.pid);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Producto no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, code, price, status = true, stock, category, thumbnails = [] } = req.body;

    if (!title || !description || !code || !price || !stock || !category) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios excepto thumbnails' });
    }

    if (title.length < 10) {
      return res.status(400).json({ error: 'El título debe tener al menos 10 caracteres' });
    }

    if (description.length < 10) {
      return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
    }

    if (price <= 0 || isNaN(price)) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
    }

    if (stock < 0 || isNaN(stock)) {
      return res.status(400).json({ error: 'El stock debe ser un número positivo' });
    }

    const existingProduct = await Product.findOne({ code });
    if (existingProduct) {
      return res.status(400).json({ error: 'Ya existe un producto con el mismo código' });
    }

    const existingTitle = await Product.findOne({ title });
    if (existingTitle) {
      return res.status(400).json({ error: 'Ya existe un producto con el mismo título' });
    }

    const products = await getProducts();
    const newId = products.length > 0 ? String(Number(products[products.length - 1].id) + 1) : '1';
    const newProduct = new Product({
      id: newId,
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails
    });

    await newProduct.save();
    
    req.io.emit('newProduct', newProduct);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error al agregar el producto:', error);
    res.status(500).json({ error: 'Error al agregar el producto' });
  }
});


router.delete('/:pid', async (req, res) => {
  try {
    const productId = req.params.pid;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await Product.deleteOne({ _id: productId });

    try {
      req.app.get('io').emit('productDeleted', productId);
    } catch (emitError) {
      console.warn('Error emitiendo evento WebSocket:', emitError);
    }

    return res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error inesperado:', error); 
    res.status(500).json({ error: 'Error inesperado al eliminar el producto' });
  }
});




router.get('/init', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos iniciales' });
  }
});

export default router;
