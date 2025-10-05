import { Client, Databases, ID } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    const body = JSON.parse(req.body);
    const { action, data } = body;

    // ✅ Initialize Appwrite SDK
    const client = new Client()
     .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT) // ✅ use proper server env name
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);

    let result;

    // 🧩 Switch based on action type
    switch (action) {
      case "create":
        result = await db.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          ID.unique(),
          data
        );
        break;

      case "get":
        result = await db.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION
        );
        break;

      case "update":
        result = await db.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          data.id, // document ID to update
          data.updateFields // fields to update
        );
        break;

      case "delete":
        result = await db.deleteDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          data.id // document ID to delete
        );
        break;

      default:
        throw new Error("Invalid action type");
    }

    log(`✅ ${action} operation successful.`);
    return res.json({ success: true, action, result });
  } catch (err) {
    error("❌ Error:", err.message);
    return res.json({ success: false, error: err.message });
  }
};
