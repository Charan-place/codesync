import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  senderName: string;
  senderId?: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  senderName: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Expire chat history 30 days after creation.
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
