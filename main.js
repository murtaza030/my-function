import { Client, Databases } from "node-appwrite";
import Enviromentobject from "./Enviromentobject.js";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(Enviromentobject.Endpoint)
    .setProject(Enviromentobject.Project_id);

  const db = new Databases(client);

  if (req.method === "GET") {
    const response = await db.listDocuments(
      Enviromentobject.Databaseid,
      Enviromentobject.Authcolletion
    );
    return res.json(response.documents);
  }
};
