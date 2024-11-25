import Cart from '../models/cart.js';

class CartManager {
  async createCart() {
    const newCart = new Cart({ products: [] });
    await newCart.save();
    return newCart;
  }

  async findCartById(cid) {
    return await Cart.findById(cid).populate('products.product');
  }

  async updateCart(cid, products) {
    const cart = await Cart.findById(cid);
    if (!cart) throw new Error('Carrito no encontrado.');
    cart.products = products;
    await cart.save();
    return cart;
  }
}

export default new CartManager();
