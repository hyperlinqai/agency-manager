import { MongoClient, Db } from "mongodb";

// MongoDB connection URL from environment variables
// Supports both MONGODB_URL and DATABASE_URL for backward compatibility
const DEFAULT_DATABASE_URL =
  process.env.MONGODB_URL || 
  process.env.DATABASE_URL || 
  "mongodb+srv://hyperlinqtechnology:Hyperlinq3b%24@hqcrm.dl06gt1.mongodb.net/?appName=hqcrm";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    // MongoDB connection options to handle SSL/TLS issues
    const clientOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Retry connection on failure
      retryWrites: true,
      retryReads: true,
    };

    client = new MongoClient(DEFAULT_DATABASE_URL, clientOptions);
    await client.connect();
    // Extract database name from URL or use default
    const url = new URL(DEFAULT_DATABASE_URL);
    const databaseName = url.pathname.slice(1) || url.searchParams.get("db") || "hqcrm";
    db = client.db(databaseName);
    console.log(`Connected to MongoDB database: ${databaseName}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    console.error("Server will continue to run, but database operations may fail.");
    // Return null - caller must handle this
    return null as any;
  }
}

export async function getDb(): Promise<Db> {
  if (!db) {
    return await connectDatabase();
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("Disconnected from MongoDB");
  }
}

// Initialize connection on import (non-blocking)
// Don't block server startup if MongoDB connection fails
connectDatabase().catch((error) => {
  console.error("Initial MongoDB connection attempt failed:", error.message);
  console.log("Server will start, but database operations will fail until connection is established.");
});
