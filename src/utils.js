import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicPath = (...subpaths) => join(__dirname, 'public', ...subpaths);

export { __dirname, publicPath };
 
import mongoose from "mongoose";

export const conectaDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://tomirodriguezcabrera:oKTw3aSabjyNg01h@cluster0.wtedt.mongodb.net/?retryWrites=true&w=majority",
      {
        dbName: "productos", 
      }
    );
    console.log("DB online...!!!");
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};
