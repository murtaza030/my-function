import { Client, Databases, ID } from "node-appwrite";

const db_id = process.env.APPWRITE_DATABASE_ID;
const collection_id = process.env.APPWRITE_USERS_COLLECTION;

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);

    if (req.method === "GET") {
      // 🔥 Appwrite will auto-generate a random ID
      const response = await db.createDocument(
        db_id,
        collection_id,
        ID.unique(),
        {
          firstName: "murtaza",
        }
      );

      return res.json({
        success: true,
        data: response,
      });
    }

    return res.json({
      success: false,
      error: "Unsupported request method",
    });
  } catch (err) {
    log("Error creating document:", err.message);
    return res.json({
      success: false,
      error: err.message,
    });
  }
};
