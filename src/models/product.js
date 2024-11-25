import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },  // Cambié 'name' por 'title'
  price: { type: Number, required: true },
  description: { type: String, required: true },
  stock: { type: Number, required: true },  // Añadí stock
  category: { type: String, required: true },  // Añadí category
  thumbnails: { type: [String], default: [] }, 
}, {
  timestamps: true, 
});

const Product = mongoose.model('Product', productSchema);

export default Product;
