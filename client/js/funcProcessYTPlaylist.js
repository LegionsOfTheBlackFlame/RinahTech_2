require('dotenv').config();
const https = require('https');

class VideoItem {
    constructor({id, title, description}) {
        this.id = id;
        this.title = title;
        this.desc = description;
    }
}

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    resolve(JSON.parse(data)); // Parse JSON data here
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (error) => reject(error));
    })
}

async function fetchYTPlaylistItems(playlistId) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const parts = ['snippet'];
    const maxResults = 50; // Maximum allowed by API per request
    let pageToken = '';
    let items = [];

    do {
        const url = `${baseUrl}?part=${parts.join(',')}&playlistId=${playlistId}&maxResults=${maxResults}&pageToken=${pageToken}&key=${apiKey}`;
        try {
            const response = await fetch(url);
            items = items.concat(response.data.items.map(item => new VideoItem({
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                description : item.snippet.description
            })));
            pageToken = response.data.nextPageToken || '';
        } catch (error) {
            console.error("error in fetchYTPlaylistItems ", error);
            break;
        }
    } while (pageToken);
    return items; 
}

// module.exports = { fetchYTPlaylistItems };