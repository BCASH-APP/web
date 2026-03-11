import { Client, Databases, Account, Functions, Storage } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const databaseId = import.meta.env.VITE_APPWRITE_DB_ID;
export const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'products';

// Collection IDs (defaults match DashingBakery COLLECTIONS)
export const salesCollectionId =
  import.meta.env.VITE_APPWRITE_SALES_COLLECTION_ID || 'sales';
export const saleItemsCollectionId =
  import.meta.env.VITE_APPWRITE_SALE_ITEMS_COLLECTION_ID || 'sale_items';
export const productsCollectionId =
  import.meta.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID || 'products';
export const categoriesCollectionId =
  import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories';
export const expensesCollectionId =
  import.meta.env.VITE_APPWRITE_EXPENSES_COLLECTION_ID || 'expenses';
export const ingredientsCollectionId =
  import.meta.env.VITE_APPWRITE_INGREDIENTS_COLLECTION_ID || 'ingredients';
export const recipesCollectionId =
  import.meta.env.VITE_APPWRITE_RECIPES_COLLECTION_ID || 'recipes';
export const recipeLinesCollectionId =
  import.meta.env.VITE_APPWRITE_RECIPE_LINES_COLLECTION_ID || 'recipe_lines';
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
export const storage = new Storage(client);
export const appwriteFunctions = new Functions(client);

