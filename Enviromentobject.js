import dotenv from "dotenv";
dotenv.config();

const Enviromentobject = {
  Project_id: process.env.APPWRITE_PROJECT_ID,
  Endpoint: process.env.APPWRITE_ENDPOINT,
  Api_key: process.env.APPWRITE_API_KEY,
  Databaseid: process.env.APPWRITE_DATABASE_ID,
  Authcolletion: process.env.APPWRITE_USERS_COLLECTION,
};

export default Enviromentobject;

