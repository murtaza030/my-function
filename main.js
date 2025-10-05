import { Client, Databases, ID } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Parse data sent from frontend
    const body = JSON.parse(req.body);

    // Init Appwrite SDK (server-side)
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT) // ✅ use proper server env name
      .setProject(process.env.APPWRITE_PROJECT_ID)
     
    const db = new Databases(client);

    // Create new document
    const response = await db.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_USERS_COLLECTION,
      ID.unique(),
      {
        firstName: body.firstName || "mustafa",
      }
    );

    log("✅ Document created successfully:", response.$id);

    // ✅ Return a proper response to the frontend
    return res.json({ success: true, id: response.$id });
  } catch (err) {
    error("❌ Error creating document:", err.message);
    return res.json({ success: false, error: err.message });
  }
};
