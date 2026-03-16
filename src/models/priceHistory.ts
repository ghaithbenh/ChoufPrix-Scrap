import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceHistory extends Document {
    productId: mongoose.Types.ObjectId;
    price: number;
    date: Date;
}

const PriceHistorySchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    price: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

export default mongoose.model<IPriceHistory>('PriceHistory', PriceHistorySchema);