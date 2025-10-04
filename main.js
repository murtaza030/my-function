import { Client, Databases, ID } from "node-appwrite";

const projectid = process.env.VITE_APPWRITE_PROJECT_ID;
const Db_id = process.env.APPWRITE_DATABASE_ID;
const collection_id = process.env.APPWRITE_USERS_COLLECTION;

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint("https://fra.cloud.appwrite.io/v1")
      .setProject(projectid);

    const db = new Databases(client);

    // ✅ Create new document
    if (req.method === "POST") {
      const body = JSON.parse(req.body); // get data from frontend
      const { username, email } = body;

      if (!username || !email) {
        return res.json({ success: false, error: "Missing fields" });
      }

      const newDoc = await db.createDocument(Db_id, collection_id, ID.unique(), {
        username,
        email,
      });

      return res.json({ success: true, data: newDoc });
    }

    // ✅ Get all documents
    if (req.method === "GET") {
      const response = await db.listDocuments(Db_id, collection_id);
      return res.json({ success: true, data: response.documents });
    }

    return res.json({ success: false, message: "Invalid method" });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message });
  }
};
