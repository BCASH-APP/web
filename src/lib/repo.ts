import { ID, Query } from 'appwrite';
import { databases, databaseId } from './appwrite';

export async function list<T>(collectionId: string, queries: string[] = []) {
  if (!databaseId) throw new Error('Missing VITE_APPWRITE_DB_ID');
  if (!collectionId) throw new Error('list: collectionId is required');

  const allQueries = [...queries, Query.limit(1000)];
  const { documents } = await databases.listDocuments(databaseId, collectionId, allQueries);
  return documents as unknown as T[];
}

export async function create<T>(collectionId: string, data: any) {
  if (!databaseId) throw new Error('Missing VITE_APPWRITE_DB_ID');
  return (await databases.createDocument(databaseId, collectionId, ID.unique(), data)) as unknown as T;
}

export async function update<T>(collectionId: string, documentId: string, data: any) {
  if (!databaseId) throw new Error('Missing VITE_APPWRITE_DB_ID');
  // We don't automatically inject fields here because it might fail for some collections
  return (await databases.updateDocument(databaseId, collectionId, documentId, data)) as unknown as T;
}

export async function remove(collectionId: string, documentId: string) {
  if (!databaseId) throw new Error('Missing VITE_APPWRITE_DB_ID');
  return await databases.deleteDocument(databaseId, collectionId, documentId);
}

export function tenantQueries(clerkUserId: string, orgId?: string) {
  if (orgId) {
    return [Query.equal('orgId', orgId)];
  }
  return [Query.equal('clerkUserId', clerkUserId), Query.isNull('orgId')];
}

