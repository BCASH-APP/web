import { Client, Databases, Account, Functions } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

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

