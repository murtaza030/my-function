import { Client, Databases, ID, Query } from "node-appwrite";
import bcrypt from "bcryptjs";
import { enviromentobj } from "./enviromentobject";

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(enviromentobj.Endpoint)
      .setProject(enviromentobj.Project_id)
      .setKey(enviromentobj.Api_key);

    const databases = new Databases(client);

    // Check if admin already exists
    const result = await databases.listDocuments(
      enviromentobj.Databaseid,
      enviromentobj.Authcolletion,
      [Query.limit(limit), Query.offset(offset), Query.orderDesc("$createdAt")]
    );

    if (result.total === 0) {
      const rawPassword = "mypassword";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const adminDoc = await databases.createDocument(
        enviromentobj.Databaseid,
        enviromentobj.Authcolletion,
        ID.unique(),
        {
          username: "admin@crm.com",
          passwordHash: hashedPassword,
          role: "admin",
        }
      );

      log("✅ Admin created successfully");
      return res.json({ success: true, adminDoc });
    } else {
      return res.json({ error: "⚠️ Admin already exists" });
    }
  } catch (err) {
    error(err.message);
    return res.json({ error: err.message });
  }
};
