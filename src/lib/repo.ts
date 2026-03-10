import { Query } from 'appwrite';
import { databases, databaseId } from './appwrite';

export async function list<T>(collectionId: string, queries: string[] = []) {
  if (!databaseId) throw new Error('Missing VITE_APPWRITE_DB_ID');
  if (!collectionId) throw new Error('list: collectionId is required');

  const allQueries = [...queries, Query.limit(1000)];
  const { documents } = await databases.listDocuments(databaseId, collectionId, allQueries);
  return documents as unknown as T[];
}

export function tenantQueries(clerkUserId: string, orgId?: string) {
  if (orgId) {
    return [Query.equal('orgId', orgId)];
  }
  return [Query.equal('clerkUserId', clerkUserId), Query.isNull('orgId')];
}

