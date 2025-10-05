// main.js
import { Client, Databases, ID } from "node-appwrite";

const db_id = process.env.APPWRITE_DATABASE_ID;
const collection_id = process.env.APPWRITE_USERS_COLLECTION;

export default async ({ req, res, log, error }) => {
  // Preflight response for browser
  if (req.method === "OPTIONS") {
    return res.send("", 204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
  }

  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT) // e.g. https://cloud.appwrite.io/v1
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    // If you need admin privileges to write to DB, uncomment and set APPWRITE_API_KEY in Env:
    // client.setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);

    if (req.method !== "POST") {
      return res.send(
        JSON.stringify({ success: false, error: "Only POST allowed" }),
        405,
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    const body = await req.json(); // parse incoming JSON

    if (!body || !body.firstName) {
      return res.send(
        JSON.stringify({ success: false, error: "Missing firstName" }),
        400,
        { "Access-Control-Allow-Origin": "*" }
      );
    }

    const doc = await db.createDocument(
      db_id,
      collection_id,
      ID.unique(),
      body
    );

    return res.send(
      JSON.stringify({ success: true, data: doc }),
      200,
      { "Access-Control-Allow-Origin": "*" }
    );
  } catch (err) {
    log("Function error:", err.message || err);
    return res.send(
      JSON.stringify({ success: false, error: err.message || String(err) }),
      500,
      { "Access-Control-Allow-Origin": "*" }
    );
  }
};
