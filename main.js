import { Client, Databases, ID } from "node-appwrite";

const db_id = process.env.APPWRITE_DATABASE_ID;
const collection_id = process.env.APPWRITE_USERS_COLLECTION;

export default async ({ req, res, log, error }) => {
  try {
    // ✅ Add CORS headers for frontend access
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // ✅ Handle preflight OPTIONS request (important)
    if (req.method === "OPTIONS") {
      return res.send("", 204);
    }

    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);

    if (req.method === "POST") {
      const body = await req.json();

      if (!body || !body.firstName) {
        return res.json({ success: false, error: "Missing firstName" });
      }

      const response = await db.createDocument(
        db_id,
        collection_id,
        ID.unique(),
        body
      );

      return res.json({ success: true, data: response });
    }

    return res.json({ success: false, error: "Only POST method allowed" });
  } catch (err) {
    log("Error:", err.message);
    return res.json({ success: false, error: err.message });
  }
};
