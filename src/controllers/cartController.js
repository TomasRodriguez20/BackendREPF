import Cart from '../models/cart.js';
import Product from '../models/product.js';

export const getCart = async (req, res) => {
    try {
        const cartId = req.params.cid; 

        const cart = await Cart.findById(cartId).populate('products.product');

        if (!cart) {
            return res.status(404).render('error', { message: 'Carrito no encontrado' });
        }

        res.render('cartDetails', { cart });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Error al cargar el carrito' });
    }
};

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.params; 

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        let cart = await Cart.findOne({});

        if (!cart) {
            cart = new Cart({
                products: [{ product: product._id, quantity: 1 }],
            });
            await cart.save();
        } else {
            const existingProduct = cart.products.find(item => item.product.toString() === product._id.toString());

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.products.push({ product: product._id, quantity: 1 });
            }

            await cart.save();
        }

        res.json({ message: 'Producto agregado al carrito' });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ message: 'Error al agregar al carrito' });
    }
};
