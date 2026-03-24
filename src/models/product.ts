import mongoose, { Schema, Document } from 'mongoose';

export interface IProductInput {
    name: string;
    store: string;
    price: number;
    url: string;
    image: string;
    category?: string;
    parentCategory?: string;
    subcategory?: string;
    description?: string;
    lastUpdated?: Date;
}

export interface IProduct extends Document, IProductInput { }

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    store: { type: String, required: true },
    price: { type: Number, required: true },
    url: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    parentCategory: { type: String, default: 'Électroménager & Autres' },
    subcategory: { type: String, default: 'Divers' },
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model<IProduct>('Product', ProductSchema);