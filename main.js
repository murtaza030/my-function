import { Client, Databases, ID, Query } from "node-appwrite";
import bcrypt from "bcryptjs";
import Enviromentobject from "./Enviromentobject.js";

export default async ({ req, res, log, error }) => {
  try {
    // ✅ Initialize Appwrite Client
    const client = new Client()
      .setEndpoint(Enviromentobject.Endpoint)
      .setProject(Enviromentobject.Project_id)
      .setKey(Enviromentobject.Api_key);

    const databases = new Databases(client);

    // ✅ Pagination defaults (safe)
    const limit = 10;
    const offset = 0;

    // ✅ Fetch all existing admins
    const result = await databases.listDocuments(
      Enviromentobject.Databaseid,
      Enviromentobject.Authcolletion,
      [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")]
    );

    // ✅ If no admin exists, create one
    if (result.total === 0) {
      const rawPassword = "mypassword"; // You can change this later
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const adminDoc = await databases.createDocument(
        Enviromentobject.Databaseid,
        Enviromentobject.Authcolletion,
        ID.unique(),
        {
          username: "admin@crm.com",
          passwordHash: hashedPassword,
          role: "admin",
        }
      );

      log("✅ Admin created successfully");
      return res.json({
        success: true,
        message: "Admin created successfully",
        admin: adminDoc,
      });
    } else {
      log("⚠️ Admin already exists");
      return res.json({ success: false, message: "Admin already exists" });
    }
  } catch (err) {
    // ✅ Error Handling
    error("❌ Error creating admin: " + err.message);
    return res.json({ success: false, error: err.message });
  }
};
