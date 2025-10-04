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

    // 🧩 Parse frontend data safely
    let bodyData = {};
    try {
      if (req.body) {
        // Appwrite sends data in { data: "stringified-json" }
        const parsed = JSON.parse(req.body);
        bodyData =
          typeof parsed.data === "string" ? JSON.parse(parsed.data) : parsed;
      }
    } catch (parseErr) {
      error("❌ JSON Parse Error: " + parseErr.message);
      return res.json({ success: false, error: "Invalid JSON format" });
    }

    // ✅ Create new document (POST)
    if (req.method === "POST") {
      const { username, email } = bodyData;

      if (!username || !email) {
        return res.json({ success: false, error: "Missing fields" });
      }

      const newDoc = await db.createDocument(
        Db_id,
        collection_id,
        ID.unique(),
        {
          username,
          email,
        }
      );

      log("✅ User created successfully!");
      return res.json({ success: true, data: newDoc });
    }

    // ✅ Get all documents (GET)
    if (req.method === "GET") {
      const response = await db.listDocuments(Db_id, collection_id);
      return res.json({ success: true, data: response.documents });
    }

    return res.json({ success: false, message: "Invalid method" });
  } catch (err) {
    error("❌ " + err.message);
    return res.json({ success: false, error: err.message });
  }
};
