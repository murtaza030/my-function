import { Client, Databases, ID } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    // ✅ Allow CORS (for frontend fetch calls)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Appwrite-Project");

    // Handle OPTIONS preflight
    if (req.method === "OPTIONS") {
      return res.send("OK");
    }

    // ✅ Parse body safely
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    } catch (parseErr) {
      log("JSON Parse Error:", parseErr);
      return res.json({ success: false, error: "Invalid JSON format" });
    }

    const { username, email } = body;

    if (!username || !email) {
      return res.json({
        success: false,
        error: "Missing fields — username or email not received",
        received: body,
      });
    }

    // ✅ Setup Appwrite client
    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);

    // ✅ Create document
    const newUser = await db.createDocument(
      process.env.DB_ID,
      process.env.COLLECTION_ID,
      ID.unique(),
      { username, email }
    );

    return res.json({
      success: true,
      message: "User added successfully ✅",
      data: newUser,
    });
  } catch (err) {
    error(err.message);
    return res.json({
      success: false,
      error: err.message,
    });
  }
};
