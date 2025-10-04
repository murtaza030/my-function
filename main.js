import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // ✅ Safely parse frontend data
    let payload = {};

    // req.body might already be an object or a string, handle both
    if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    } else if (typeof req.body === "object") {
      payload = req.body;
    }

    const { username, email } = payload;

    // ✅ Check for missing fields
    if (!username || !email) {
      return res.json({
        success: false,
        error: "Missing fields — username or email not received",
        received: payload, // show what was actually received for debugging
      });
    }

    // ✅ Setup Appwrite client
    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // ✅ Create document
    const result = await databases.createDocument(
      process.env.DB_ID,
      process.env.COLLECTION_ID,
      "unique()",
      {
        username,
        email,
      }
    );

    return res.json({
      success: true,
      message: "User added successfully",
      user: result,
    });
  } catch (err) {
    log(err);
    return res.json({
      success: false,
      error: err.message || "Unknown error",
    });
  }
};
