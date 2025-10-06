import { Client, Databases, ID } from "node-appwrite";
import bcrypt from "bcrypt";

export default async ({ req, res, log, error }) => {
  try {
    const body = JSON.parse(req.body);
    const { action, data } = body;

    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);
    let result;

    switch (action) {
      // 🧩 CREATE USER (hash password)
      case "create": {
        if (!data.Password) throw new Error("Password required");

        const hashedPassword = await bcrypt.hash(data.Password, 10);
        const userData = { ...data, Password: `${hashedPassword}` };

        result = await db.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          ID.unique(),
          userData
        );
        break;
      }

      // 🧩 LOGIN USER (check email + password)
      case "login": {
        // 1️⃣ Find user by email
        const users = await db.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION
        );

        const user = users.documents.find((u) => u.email === data.email);

        if (!user) throw new Error("User not found");

        // 2️⃣ Compare password
        const isMatch = await bcrypt.compare(data.Password, user.Password);

        if (!isMatch) throw new Error("Invalid password");

        // ✅ Login success
        result = { message: "Login successful", user };
        break;
      }

      // 🧩 GET ALL USERS
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
          data.id,
          data.updateFields
        );
        break;

      case "delete":
        result = await db.deleteDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          data.id
        );
        break;

      default:
        throw new Error("Invalid action type");
    }

    return res.json({ success: true, action, result });
  } catch (err) {
    error("❌ Error:", err.message);
    return res.json({ success: false, error: err.message });
  }
};
