import { Client, Databases, ID, Query } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67cafd2900004d9e1b7a')

const database = new Databases(client)

export { ID, Query, client, database }
