import { Client, Databases, ID, Query } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67cafd2900004d9e1b7a')

const database = new Databases(client)

// Create an appwrite object that can be imported directly
const appwrite = {
  client,
  database,
  ID,
  Query,
}

export { ID, Query, client, database, appwrite }
