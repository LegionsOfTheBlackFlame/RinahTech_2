import axios from "axios";
import dotenv from "dotenv";
import  express  from "express";
import {v2 as cloudinary} from "cloudinary";



const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();
app.use(express.json());

cloudinary.config({ 
    cloud_name: 'sample', 
    api_key: '783784735286392', 
    api_secret: 'a676b67565c6767a6767d6767f676fe1'
  });



class VideoItem {
    constructor({id, title, description}) {
        this.id = id;
        this.title = title;
        this.desc = description;
    }
}
// Fetch videos from playlist
app.get('/api/playlist/:id', async (req, res) =>{
    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistId = req.params.id;
    const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const parts = ['snippet'];
    const maxResults = 50; // Maximum allowed by API per request
    let pageToken = '';
    let items = [];
   

    do {
        const url = `${baseUrl}?part=${parts.join(',')}&playlistId=${playlistId}&maxResults=${maxResults}&pageToken=${pageToken}&key=${apiKey}`;
        try {
            const response = await axios.get(url);
            items = items.concat(response.data.items.map(item => ({
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                description: item.snippet.description
            })));
            pageToken = response.data.nextPageToken || '';
        } catch (error) {
            console.error("Error in fetchYTPlaylistItems:", error);
            res.status(400).send('Failed to fetch playlist items');
            return;
        }
    } while (pageToken);

    console.log("All playlist items:", items);
    res.json(items); 
});

// Fetch photos from folder
app.get('/api/images', async (req, res) => {

    try {
        const { resources } = await cloudinary.search
        .expression('folder:samples')
        .max_results(5)
        .execute();

        const imageUrls = resources.map(file => file.secure_url);
        res.send(imageUrls);
    } catch (error) {
        console.error("trouble fetching images from cloudinary: ", error);
    }
});

app.listen(PORT, ()=> {
    console.log('server running on port ${PORT}');
})

await fetch('http://localhost:3000/api/playlist/PLFh8wpMiEi8_-arqqWoUQE2w07_0HzHys&si=dMxyePbWQrA7AXKu')
.then(data => console.log(data.items))
.catch(error => console.error(error)); 

const testingCloudinary = await fetch('http://localhost:3000/api/images');
const imageUrltest = await testingCloudinary.json();

console.log("the cloudinary test ", imageUrltest);
// console.log("test");