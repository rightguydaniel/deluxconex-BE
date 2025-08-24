import express from 'express';
import { getProductById, getProducts, getProductsByCategory, searchProducts } from '../controllers/admin/getProduct';


const productRoutes = express.Router();

// Get all products with filtering and pagination
productRoutes.get('/products', getProducts);

// Get product by ID
productRoutes.get('/:id', getProductById);

// Get products by category
productRoutes.get('/category/:category', getProductsByCategory);

// Search products
productRoutes.get('/search', searchProducts);

export default productRoutes;