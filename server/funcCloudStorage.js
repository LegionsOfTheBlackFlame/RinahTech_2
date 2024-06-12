import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
const keyPath = './Google-ServiceAccountAuth.json';

async function googleAuth() {
    const auth = new GoogleAuth({
        keyFile: keyPath,
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    return new Storage({ auth: client });
}


async function fetchImagesFromCloudStorage(bucketName, callback) {
    const storage = await googleAuth()
    try {
        console.log("fetching images");
        const [files] = await storage.bucket(bucketName).getFiles({ autoPaginate: false, maxResults: 5 });
        let items = [];

        for (const file of files) {
            const metadata = await file.getMetadata();
            items.push({
                image_source: `https://storage.googleapis.com/${bucketName}/${file.name}`,
                date: new Date(metadata[0].timeCreated),
                item_type: 'image'
            });

            // Send partial data to callback
            if (callback) {
                callback(items);
            }
        }

        let nextQuery = files.nextQuery;
        while (nextQuery) {
            const [nextFiles] = await storage.bucket(bucketName).getFiles(nextQuery);
            for (const file of nextFiles) {
                const metadata = await file.getMetadata();
                items.push({
                    image_source: `https://storage.googleapis.com/${bucketName}/${file.name}`,
                    date: new Date(metadata[0].timeCreated),
                    item_type: 'image'
                });

                // Send partial data to callback
                if (callback) {
                    callback(items);
                }
            }
            nextQuery = nextFiles.nextQuery;
        }

        return items;
    } catch (error) {
        console.error('Failed to fetch images:', error);
        return [];
    }
}


export default fetchImagesFromCloudStorage;

async function cloudAuth() {
    const client = new googleAuth();
    
}