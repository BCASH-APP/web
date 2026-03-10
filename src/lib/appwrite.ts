import { Client, Databases, Account, Functions } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const databaseId = import.meta.env.VITE_APPWRITE_DB_ID;

// Collection IDs (defaults match DashingBakery mobile app names)
export const salesCollectionId =
  import.meta.env.VITE_APPWRITE_SALES_COLLECTION_ID || 'sales';
export const saleItemsCollectionId =
  import.meta.env.VITE_APPWRITE_SALE_ITEMS_COLLECTION_ID || 'sale_items';
export const paymentsCollectionId = import.meta.env.VITE_APPWRITE_PAYMENTS_COLLECTION_ID;

const client = new Client();

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    'Appwrite env vars missing. Set VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID for API calls.',
  );
}

export const appwriteClient = client;
export const databases = new Databases(client);
export const account = new Account(client);
export const appwriteFunctions = new Functions(client);

