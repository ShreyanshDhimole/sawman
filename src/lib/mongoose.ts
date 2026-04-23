import mongoose from 'mongoose';
import dns from 'node:dns';

/** * DNS FIX:
 * Many local networks and certain Node.js versions fail to resolve 
 * MongoDB Atlas SRV records. This forces Node to use Google's DNS.
 */
if (process.env.NODE_ENV === 'development') {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    };

    // We can safely cast MONGODB_URI because we check it above
    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected Successfully');
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error('❌ MongoDB Connection Error:', e);
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;