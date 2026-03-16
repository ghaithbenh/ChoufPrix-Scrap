import Product, { type IProductInput } from './models/product.js';
import PriceHistory from './models/priceHistory.js';

export async function updateProduct(product: IProductInput) {
    const existing = await Product.findOne({ name: product.name, store: product.store });

    if (!existing) {
        const created = await Product.create({ ...product, lastUpdated: new Date() });
        await PriceHistory.create({ productId: created._id, price: product.price, date: new Date() });
        return;
    }

    if (existing.price !== product.price) {
        await PriceHistory.create({ productId: existing._id, price: product.price, date: new Date() });
        existing.price = product.price;
        existing.lastUpdated = new Date();
        await existing.save();
    }
}