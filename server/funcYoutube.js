import axios from "axios";

export default async function fetchYouTubePlaylistItems(playlistId, apiKey, callback) {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
    let pageToken = '';
    let items = [];

    do {
        // console.log("Fetching page with token:", pageToken);
        const url = `${baseUrl}?key=${apiKey}&part=snippet&playlistId=${playlistId}&maxResults=10&pageToken=${pageToken}&order=date`;
        // console.log("Request URL:", url);
        try {
            const response = await axios.get(url);

            
            const fetchedItems = response.data.items.map(item => {
                const thumbnailUrl = item.snippet.thumbnails?.high?.url || '';   
                return {
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                image_source: thumbnailUrl,
                date: new Date(item.snippet.publishedAt),
                item_type: "video"
            }});
            items = items.concat(fetchedItems);
            pageToken = response.data.nextPageToken || '';

            // Send partial data to callback
            if (callback) {
                callback(fetchedItems);
            }
        } catch (error) {
            console.error("Error fetching data:", error.response ? error.response.data : error.message);
            break;
        }
    } while (pageToken);

    return items;
}
