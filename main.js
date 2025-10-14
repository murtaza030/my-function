import fs from "fs";
import { execSync } from "child_process";
import fetch from "node-fetch";
import { Client, Databases, Query, ID } from "node-appwrite";
import bcrypt from "bcrypt";
import crypto from "crypto";

export default async ({ req, res, log, error }) => {
  try {
    const body = JSON.parse(req.body);
    const { mainAction, action, data, videoUrl, imageUrl } = body;

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID);

    const db = new Databases(client);
    let result;

    switch (mainAction) {
      /* ======================
         🎬 CASE 1: VIDEO MERGING
      ====================== */
      case "video": {
        const videoPath = "/tmp/video.webm";
        const imagePath = "/tmp/image.png";
        const outputPath = "/tmp/output.mp4";

        // Download input files
        const videoBuffer = await fetch(videoUrl).then((r) => r.arrayBuffer());
        fs.writeFileSync(videoPath, Buffer.from(videoBuffer));

        const imageBuffer = await fetch(imageUrl).then((r) => r.arrayBuffer());
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));

        // Merge using ffmpeg
        const cmd = `ffmpeg -i ${videoPath} -i ${imagePath} -filter_complex "[1][0]overlay=0:0:format=auto" -pix_fmt yuv420p -c:v libx264 ${outputPath}`;
        execSync(cmd, { stdio: "inherit" });

        // Convert output to base64
        const mergedBuffer = fs.readFileSync(outputPath);
        const base64Video = mergedBuffer.toString("base64");

        result = {
          message: "Video merged successfully",
          video: base64Video,
        };
        break;
      }

      /* ======================
         👤 CASE 2: USER MANAGEMENT
      ====================== */
      case "user": {
        switch (action) {
          // 🧩 CREATE USER
          case "create": {
            if (!data.Password) throw new Error("Password required");
            const hashedPassword = await bcrypt.hash(data.Password, 10);

            // Find creator (if any)
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
            const userData = {
              ...data,
              Password: hashedPassword,
              ...extraIds,
            };

            const createdUser = await db.createDocument(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_USERS_COLLECTION,
              ids,
              userData
            );

            result = createdUser;

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
                process.env.APPWRITE_User_Details_COLLECTION,
                ids,
                agentProfileData
              );

              result = { user: createdUser, agentProfile: agentResult };
            }

            break;
          }

          // 🧩 LOGIN
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
          case "get": {
            const { role, email } = data;
            if (role === "admin") {
              result = await db.listDocuments(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_USERS_COLLECTION
              );
            } else if (role === "broker") {
              result = await db.listDocuments(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_USERS_COLLECTION,
                [Query.equal("brokerEmail", email)]
              );
            } else {
              result = { documents: [] };
            }
            break;
          }

          // 🧩 UPDATE USER
          case "update":
            result = await db.updateDocument(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_USERS_COLLECTION,
              data.id,
              data.updateFields
            );
            break;

          // 🧩 UPDATE PERMISSIONS
          case "updateUser_permissions":
            result = await db.updateDocument(
              process.env.APPWRITE_DATABASE_ID,
              process.env.APPWRITE_User_Details_COLLECTION,
              data.idp,
              data.updateFieldsp
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
            throw new Error("Invalid user action");
        }
        break;
      }

      /* ======================
         🚫 DEFAULT
      ====================== */
      default:
        throw new Error("Invalid mainAction type (use 'video' or 'user')");
    }

    return res.json({ success: true, mainAction, action, result });
  } catch (err) {
    error("❌ Error:", err.message);
    return res.json({ success: false, error: err.message });
  }
};
