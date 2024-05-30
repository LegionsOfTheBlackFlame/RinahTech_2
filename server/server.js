import axios from "axios";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import  express  from "express";
import { request } from "express";

import { google } from "googleapis";
import {Storage} from "@google-cloud/storage";

import { generateIV, encryptTokens, decryptTokens } from "./encryption.js";
import { dbConnection, dbStoreTokens, dbFetchSingular, dbFetchGoogleReviews, dbFetchServiceCardContent, dbFetchHeroContent} from "./database.js";
import fetchYouTubePlaylistItems from "./funcYoutube.js";
// import fetchImagesFromCloudStorage from "./funcCloudStorage.js";
import combineAndSortData from "./funcUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));



// Google APIs auth environment configs
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const oauth2client = new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    'http://localhost:3000/oauth2_initial_callback'  
);

app.get('/proxy', async (req, res) => {
    try {
        const url = req.query.url;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        res.set('Content-Type', response.headers['content-type']);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching the URL:', error);
        res.status(500).send('Failed to fetch the resource.');
    }
});
app.get('/auth', (req, res) => {
    const authUrl = oauth2client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/cloud-platform'],
    });
    res.redirect(authUrl);
  });
// Initial Auth process for Google APIs
app.get('/oauth2_initial_callback', async (req, res) => {
    console.log("running auth process...");
    const { code } = req.query;
    
    try {
    const { tokens } = await oauth2client.getToken(code);
    oauth2client.setCredentials(tokens);
    console.log('tokens set: ', tokens);
    res.send('success!'); 

    const thisIV = generateIV();
    const thisAccessToken = encryptTokens(tokens.access_token, thisIV);
    console.log("this is the encrypted access token: ", thisAccessToken);
    const thisRefreshToken = encryptTokens(tokens.refresh_token, thisIV);
    console.log("this is the encrypted refresh token: ", thisRefreshToken);

    dbStoreTokens(thisAccessToken, thisRefreshToken, tokens.token_type, tokens.expiry_date, thisIV);
}
    catch (error) {
        console.error("failed");
        res.status(500).send('failed to authenticate.')
    }  
})

// Retreive and decrypt auth tokens
app.get('/fetch_tokens_from_database', async (req, res) => {
    try {
        const encryptedAccessToken = await dbFetchSingular('tkn_access', 'sl_tokens');
        console.log("test", encryptedAccessToken);
        const encryptedRefreshToken = await dbFetchSingular('tkn_refresh', 'sl_tokens');
        const thisIV = await dbFetchSingular('tkn_encrypted_iv', 'sl_tokens');

        if (encryptedAccessToken.length > 0 && encryptedRefreshToken.length > 0 && thisIV.length > 0) {
            const decryptedAccessToken = decryptTokens(encryptedAccessToken[0].tkn_access, thisIV[0].tkn_encrypted_iv);
            const decryptedRefreshToken = decryptTokens(encryptedRefreshToken[0].tkn_refresh, thisIV[0].tkn_encrypted_iv);
            console.log("access token: ", decryptedAccessToken);
            console.log("refresh token: ", decryptedRefreshToken);
            oauth2client.setCredentials({
                access_token: decryptedAccessToken,
                refresh_token: decryptedRefreshToken
            })
            res.send({ accessToken: decryptedAccessToken, refreshToken: decryptedRefreshToken });

        } else {
            res.status(404).send("Tokens not found");
        }
    } catch (error) {
        console.error("Error fetching tokens:", error);
        res.status(500).send("Failed to fetch tokens from database");
    }
});

// Fetches images from cloud storage and videos from youtube playlist
app.get('/fetch_media', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
   
    let allItems = [];

    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistId = 'PLQY1ec61yEYkoR3hgYM3f1tp0TAsWTTsq';
    const bucketName = 'sealeon';

    const videoCallback = (partialData) => {
       
       console.log(partialData);
     res.write(JSON.stringify(partialData));
        
    };

    const imageCallback = (partialData) => {
       
        
    res.write(JSON.stringify(partialData));
       
    };

    const videoPromise = fetchYouTubePlaylistItems(playlistId, apiKey, videoCallback);
    const imagePromise = fetchImagesFromCloudStorage(bucketName, imageCallback);
    
    try {
        await Promise.all([
            videoPromise.catch(err => console.error('Video fetch error:', err)),
            imagePromise.catch(err => console.error('Image fetch error:', err))
        ]);
    } catch (err) {
        console.error('Error fetching media:', err);
    } finally {
        res.end();
    }
});

// Fetches Goolge reviews stored in the database
app.get('/google_reviews', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
        const allReviews = await dbFetchGoogleReviews();
        res.json(allReviews);
    } catch(error) {
        throw error;
    }
});

app.get('/service_cards_content', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
        const allcontent= await dbFetchServiceCardContent();
        res.json(allcontent);
    } catch(error) {
        throw error;
    }
})
app.get('/hero_content', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
        const allcontent = await dbFetchHeroContent();
        res.json(allcontent);
    } catch(error) {
        throw error;
    }
});
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
  });

app.listen(PORT, ()=> {
    console.log(`server running on port ${PORT}`);
})

const storage = new Storage({
    projectId: 'sealeon-diving',
    keyFilename: null
});

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
