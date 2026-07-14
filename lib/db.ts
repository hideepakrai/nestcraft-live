import { MongoClient, Db } from "mongodb";

let MONGODB_URI = process.env.MONGODB_URI;

// Bypass DNS SRV errors (ECONNREFUSED) by mapping to direct IP/hostname records for the MongoDB cluster
if (
  MONGODB_URI?.startsWith("mongodb+srv://") &&
  MONGODB_URI.includes("@kalpcluster.mr8bacs.mongodb.net")
) {
  MONGODB_URI = MONGODB_URI.replace(
    "@kalpcluster.mr8bacs.mongodb.net/",
    "@ac-zxbieql-shard-00-00.mr8bacs.mongodb.net:27017,ac-zxbieql-shard-00-01.mr8bacs.mongodb.net:27017,ac-zxbieql-shard-00-02.mr8bacs.mongodb.net:27017/?ssl=true&replicaSet=atlas-vw7phq-shard-0&authSource=admin&retryWrites=true&w=majority",
  ).replace("mongodb+srv://", "mongodb://");
}

const TENANT_DB_NAME = process.env.NEXT_PUBLIC_TENANT_ID;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}

// if (!TENANT_DB_NAME) {
//   throw new Error(
//     "Please define the TENANT_DB_NAME environment variable inside .env",
//   );
// }

let cachedClient = (global as any).mongoClient;

if (!cachedClient) {
  cachedClient = (global as any).mongoClient = { conn: null, promise: null };
}

export async function connectClient(): Promise<MongoClient> {
  if (cachedClient.conn) return cachedClient.conn;

  if (!cachedClient.promise) {
    cachedClient.promise = MongoClient.connect(MONGODB_URI as string);
  }

  try {
    cachedClient.conn = await cachedClient.promise;
  } catch (e) {
    cachedClient.promise = null;
    throw e;
  }

  return cachedClient.conn;
}

export async function connectMasterDB(): Promise<Db> {
  const client = await connectClient();
  return client.db("kalp_master");
}

export async function connectTenantDB(): Promise<Db> {
  const client = await connectClient();
  return client.db(TENANT_DB_NAME);
}
