import fs from "fs";
import { execSync } from "child_process";
import { Client, Storage } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    const { mainAction, videoFileId, imageFileId, bucketId } = JSON.parse(req.body);

    if (mainAction !== "video") {
      return res.json({ success: false, error: "Invalid mainAction" });
    }

    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
      .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.VITE_APPWRITE_API_KEY); // must have storage read permission

    const storage = new Storage(client);

    const videoBuffer = await storage.getFileDownload(bucketId, videoFileId);
    const imageBuffer = await storage.getFileDownload(bucketId, imageFileId);

    const videoPath = "/tmp/video.webm";
    const imagePath = "/tmp/image.png";
    const outputPath = "/tmp/output.mp4";

    fs.writeFileSync(videoPath, videoBuffer);
    fs.writeFileSync(imagePath, imageBuffer);

    // Merge with FFmpeg
    const cmd = `ffmpeg -i ${videoPath} -i ${imagePath} -filter_complex "[1][0]overlay=0:0:format=auto" -pix_fmt yuv420p -c:v libx264 ${outputPath}`;
    execSync(cmd, { stdio: "inherit" });

    const mergedBuffer = fs.readFileSync(outputPath);
    const base64Video = mergedBuffer.toString("base64");

    return res.json({ success: true, result: { video: base64Video } });
  } catch (err) {
    error(err);
    return res.json({ success: false, error: err.message });
  }
};
