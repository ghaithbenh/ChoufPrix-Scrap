import mongoose, { Schema, Document } from 'mongoose';

export interface IProductInput {
    name: string;
    store: string;
    price: number;
    url: string;
    image: string;
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
    lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model<IProduct>('Product', ProductSchema);