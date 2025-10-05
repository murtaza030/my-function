import { Client, Databases,ID } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // Parse data sent from frontend
    const body = JSON.parse(req.body);

    // Init Appwrite SDK (server-side)
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)


    const db = new Databases(client);

    // Create new document
    const response = await db.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_USERS_COLLECTION,
      ID.unique(), // let Appwrite create a unique ID
      {
        firstName: body.firstName
      }
    );

    log("Document created successfully:", response.$id);
    res.json({ success: true, id: response.$id });
  } catch (err) {
    error("Error creating document:", err.message);
    res.json({ success: false, error: err.message });
  }
};
