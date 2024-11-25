import Product from '../models/product.js';

class ProductManager {
  async findProductById(pid) {
    return await Product.findById(pid);
  }
}

export default new ProductManager();
