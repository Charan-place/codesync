import mongoose, { Schema, Document } from 'mongoose';

export interface ISnippet extends Document {
  ownerId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  language: string;
  savedAt: Date;
}

const snippetSchema = new Schema<ISnippet>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  title: { type: String, default: 'Untitled snippet' },
  content: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  savedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ISnippet>('Snippet', snippetSchema);
