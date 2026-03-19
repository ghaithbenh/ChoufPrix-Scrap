import Product, { type IProductInput } from './models/product.js';
import PriceHistory from './models/priceHistory.js';
import { categoryFromUrl } from './utils/categorize.js';

export async function updateProduct(product: IProductInput) {
    const existing = await Product.findOne({ name: product.name, store: product.store });

    if (!existing) {
        const created = await Product.create({ ...product, lastUpdated: new Date() });
        await PriceHistory.create({ productId: created._id, price: product.price, date: new Date() });
        return;
    }

    if (existing.price !== product.price || existing.category !== product.category) {
        if (existing.price !== product.price) {
            await PriceHistory.create({ productId: existing._id, price: product.price, date: new Date() });
            existing.price = product.price;
        }
        if (product.category) {
            existing.category = product.category;
        }
        existing.lastUpdated = new Date();
        await existing.save();
    }
}