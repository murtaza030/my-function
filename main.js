import { Client, Databases } from "node-appwrite";
import { ID } from "appwrite";
const db_id = process.env.APPWRITE_DATABASE_ID;
const collection_id = process.env.APPWRITE_USERS_COLLECTION;
export default async ({ req, res, log, error }) => {

    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);
    if (req.method === "GET") {
        const id = ID.unique();
        const response = await databases.createDocument(
      db_id, 
      collection_id,    
      id,                            
      {
        firstName:murtaza
      }
    );
      return res.json(response.documents);
    }
};

