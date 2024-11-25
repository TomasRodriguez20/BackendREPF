import mongoose from 'mongoose';
import Product from './product.js';  

const cartSchema = new mongoose.Schema({
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
  });
  
  const Cart = mongoose.model('Cart', cartSchema);

export default Cart;  

export const addToCart = async (productId) => {
    try {
        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Producto no encontrado');
        }

        const userCart = await Cart.findOne({});  

        if (!userCart) {
            const newCart = new Cart({
                products: [{ product: product._id, quantity: 1 }]
            });
            await newCart.save();
            return newCart; 
        }

        const existingProduct = userCart.products.find(item => item.product.toString() === product._id.toString());

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            userCart.products.push({ product: product._id, quantity: 1 });
        }

        await userCart.save();
        return userCart;
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        throw error;
    }
};



