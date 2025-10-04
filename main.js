import {Client,Databases} from 'node-appwrite'
const projectid = process.env.VITE_APPWRITE_PROJECT_ID
const Db_id = process.env.APPWRITE_DATABASE_ID
const collection_id = process.env.APPWRITE_USERS_COLLECTION
export default async ({ req, res, log, error})=>{
  const client = new Client()
      .setEndpoint("https://fra.cloud.appwrite.io/v1")
      .setProject(projectid)
  const db = new Databases(client)
  if(req.method == 'GET'){
    const response = await db.listDocuments(
      Db_id,
      Collection_Id
    )
    return res.json(response.documents)
  }
  return res.send('hello')
}
