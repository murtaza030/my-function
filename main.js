import { Client, Databases, Query, ID } from "node-appwrite";
import bcrypt from "bcrypt";
import crypto from "crypto";

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
      // 🧩 CREATE USER (with role logic)
      case "create": {
        if (!data.Password) throw new Error("Password required");

        // 🔒 Hash password
        const hashedPassword = await bcrypt.hash(data.Password, 10);

        // 🔍 Find the creator
        let creator = null;
        if (data.createdByEmail) {
          const allUsers = await db.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_USERS_COLLECTION
          );
          creator = allUsers.documents.find(
            (u) => u.email === data.createdByEmail
          );
        }

        // 🧩 Role-based ID logic
        const random = Math.floor(Math.random() * 1000);
        let extraIds = {};

        if (data.role === "admin") {
          extraIds = { adminId: `ad${random}` };
        } else if (data.role === "broker") {
          if (!creator || creator.role !== "admin")
            throw new Error("Only admin can create broker");
          extraIds = {
            brokerId: `br${random}`,
            adminId: creator.adminId || creator.id || `ad${random}`,
          };
        } else if (data.role === "agent") {
          if (!creator)
            throw new Error("Agent must be created by admin or broker");
          if (creator.role === "admin") {
            extraIds = {
              agentId: `ag${random}`,
              adminId: creator.adminId || creator.id,
            };
          } else if (creator.role === "broker") {
            extraIds = {
              agentId: `ag${random}`,
              brokerId: creator.brokerId || creator.id,
              adminId: creator.adminId,
            };
          } else {
            throw new Error("Agent cannot create another user");
          }
        } else {
          throw new Error("Invalid role");
        }
        const ids = ID.unique();
        // 🧾 Final user data
        const userData = {
          ...data,
          Password: hashedPassword,
          ...extraIds,
        };

        // 💾 Save user in main Users collection
        const createdUser = await db.createDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          ids,
          userData
        );

        result = createdUser;

        // ✅ If agent is created, add to another collection
        if (data.role === "agent") {
          const agentProfileData = {
            agentId: createdUser.agentId,
            createdBy: createdUser.createdByEmail,
            brokerId: createdUser.brokerId || null,
            adminId: createdUser.adminId || null,
            createdAt: new Date().toISOString(),
            status: "Active",
          };

          const agentResult = await db.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_User_Details_COLLECTION, // 🧩 your second collection ID here
            ids,
            agentProfileData
          );

          // combine result for clarity
          result = { user: createdUser, agentProfile: agentResult };
        }

        break;
      }

      // 🧩 LOGIN USER
      case "login": {
        const { email, Password } = data;

        const users = await db.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          [Query.equal("email", email)]
        );

        const user = users.documents[0];
        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) throw new Error("Invalid email or password");

        const token = crypto.randomBytes(24).toString("hex");

        result = {
          message: "Login successful",
          token,
          user: {
            $id: user.$id,
            Username: user.Username,
            email: user.email,
            role: user.role,
          },
        };
        break;
      }

      // 🧩 GET USERS
      case "get":
        result = await db.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION
        );
        break;

      // 🧩 UPDATE
      case "update":
        result = await db.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_USERS_COLLECTION,
          data.id,
          data.updateFields
        );
        break;

      // 🧩 DELETE
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
