import { Storage } from "@google-cloud/storage";
const storage = new Storage();

async function fetchImagesFromCloudStorage(bucketName, callback) {
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