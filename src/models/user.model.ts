import mongoose, { Schema } from 'mongoose';

const userSchema: Schema = new Schema({
    name: { type: String, required: true, lowercase: true },
    lastname: { type: String, required: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    salt: { type: String }
}, { collection: 'user' });

export default mongoose.model('User', userSchema);
