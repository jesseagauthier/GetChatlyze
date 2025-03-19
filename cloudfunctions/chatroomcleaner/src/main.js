import { Client, Databases} from 'node-appwrite';

// Main function handler
export default async ({ req, res, log, error }) => {
//    ## This function will auto trigger daily - upon trigger this function will check the chatRooms collection for any chats that have not updated in 24 hours using lastMessageAt OR if endedAt has a value 
};