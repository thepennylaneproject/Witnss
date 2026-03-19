import { Client, Databases, Storage } from 'node-appwrite';

export type AppwriteCollections = {
  persons: string;
  records: string;
  submissions: string;
  disputes: string;
};

export function getAppwriteServer():
  | {
      databases: Databases;
      storage: Storage;
      databaseId: string;
      collections: AppwriteCollections;
      bucketEvidence: string;
    }
  | null {
  const endpoint = (process.env.APPWRITE_ENDPOINT ?? process.env.VITE_APPWRITE_ENDPOINT ?? '').trim();
  const projectId = (process.env.APPWRITE_PROJECT_ID ?? process.env.VITE_APPWRITE_PROJECT_ID ?? '').trim();
  const apiKey = (process.env.APPWRITE_API_KEY ?? '').trim();
  if (!endpoint || !projectId || !apiKey) return null;

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  return {
    databases: new Databases(client),
    storage: new Storage(client),
    databaseId: process.env.APPWRITE_DATABASE_ID?.trim() || 'main',
    collections: {
      persons: process.env.APPWRITE_COLLECTION_PERSONS?.trim() || 'persons',
      records: process.env.APPWRITE_COLLECTION_RECORDS?.trim() || 'records',
      submissions: process.env.APPWRITE_COLLECTION_SUBMISSIONS?.trim() || 'submissions',
      disputes: process.env.APPWRITE_COLLECTION_DISPUTES?.trim() || 'disputes',
    },
    bucketEvidence: process.env.APPWRITE_BUCKET_EVIDENCE?.trim() || 'evidence',
  };
}
