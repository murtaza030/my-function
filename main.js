import { Client, Databases } from "node-appwrite";
import Enviromentobject from "./Enviromentobject.js";
const db_id = process.env.APPWRITE_DATABASE_ID,
const collection_id = process.env.APPWRITE_USERS_COLLECTION
export default async ({ req, res, log, error }) => {

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID);

    const db = new Databases(client);

    if (req.method === "GET") {
      const response = await db.listDocuments(
        db_id,
        collection_id
      );
      return res.json(response.documents);
    }
};

