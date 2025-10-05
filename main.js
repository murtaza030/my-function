import { Client, Databases, ID } from "node-appwrite";

const db_id = process.env.APPWRITE_DATABASE_ID;
const collection_id = process.env.APPWRITE_USERS_COLLECTION;

export default async ({ req, res, log, error }) => {
  try {
    // ✅ Initialize Appwrite Client
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);

    // ✅ Only allow POST requests
    if (req.method === "POST") {
      // 🧠 Parse request body from frontend
      const body = await req.json();
      if (!body || !body.firstName) {
        return res.json({
          success: false,
          error: "Missing field: firstName",
        });
      }

      // ✅ Create document with random ID
      const response = await db.createDocument(
        db_id,
        collection_id,
        ID.unique(),
        body
      );

      return res.json({
        success: true,
        data: response,
      });
    }

    // ❌ If method not POST
    return res.json({
      success: false,
      error: "Only POST method allowed",
    });
  } catch (err) {
    log("Error:", err.message);
    return res.json({
      success: false,
      error: err.message,
    });
  }
};
