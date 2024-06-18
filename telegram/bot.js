import { Markup, Telegraf, session, Scenes, Context } from "telegraf";
import axios from "axios";
import mysql from "mysql2";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import { JSDOM } from "jsdom";
import { GoogleAuth } from "google-auth-library";


dotenv.config();
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Database environment variables
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
})

// Establish connection to database
dbConnection.connect(error => {
    if (error) throw error;
    console.log("connected to database.");
});
async function googleAuth() {
    const auth = new GoogleAuth({
        keyFile: keyPath,
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    return new Storage({ auth: client });
}

const storage = await googleAuth();
const botState = {
    userId: 1,
    currentNode: "main_menu",
    currentNodeElement: {},
    currentNodeChildren: [],
    currentNodeParent: {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFilePath = path.join(__dirname, '-app-structure.html');
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// ----ANNOUNCEMENTS----
const sceneAnnouncement = new Scenes.BaseScene("announcements");
sceneAnnouncement.enter(async (ctx) => {
    ctx.session.this = {};
    const thisAnnouncement = await fetchActiveAnnouncement();
    ctx.session.this.activeAnnouncement = thisAnnouncement[0] ? thisAnnouncement[0].announcement : "";
    ctx.session.this.activeAnnouncementSetAt = thisAnnouncement[0] ? thisAnnouncement[0].announced_at : "";
    ctx.reply(`Current announcement: \n ${ctx.session.this.activeAnnouncement}\n \n What would you like to do?`, Markup.inlineKeyboard([
        Markup.button.callback('Update Announcement', 'update'),
        Markup.button.callback('Remove Announcement', 'remove'),
        Markup.button.callback('View Archive', 'view_archive'),
        Markup.button.callback('Back', `back`)
    ]));
});

sceneAnnouncement.action('update', (ctx) => {
    ctx.scene.enter('update_announcement');
});

sceneAnnouncement.action('remove', (ctx) => {
    ctx.scene.enter('remove_announcement');
});

sceneAnnouncement.action('view_archive', (ctx) => {
    ctx.scene.enter('view_archive');
});

const sceneAnnouncementUpdate = new Scenes.BaseScene('update_announcement');

sceneAnnouncementUpdate.enter((ctx) => {
    ctx.reply(`Current announcement: \n ${ctx.session.this.activeAnnouncement} \n \n Please send your new announcement...`);
});

sceneAnnouncementUpdate.on('text', async (ctx) => {
    ctx.session.this.newAnnouncement = ctx.message.text;
    archiveAnnouncement(ctx);
    ctx.reply(`Announcement updated to: \n ${ctx.session.this.newAnnouncement}`,
        Markup.inlineKeyboard([
            Markup.button.callback("Cancel", "cancel"),
            Markup.button.callback("Confirm", "confirm")
        ]));
});

sceneAnnouncementUpdate.action("confirm", async (ctx) => {
    updateActiveAnnouncement(ctx);
    ctx.scene.enter("announcements");
});

sceneAnnouncementUpdate.action("cancel", async (ctx) => {
    await deleteLastArchiveEntry();
    ctx.scene.enter("announcements");
});

const sceneAnnouncementRemove = new Scenes.BaseScene("remove_announcement");
sceneAnnouncementRemove.enter(async (ctx) => {
    archiveAnnouncement(ctx);
    ctx.reply("Are you sure you want to remove the current announcement from the website?", Markup.inlineKeyboard([
        Markup.button.callback("Cancel", "cancel"),
        Markup.button.callback("Confirm", "confirm")
    ]))
})
sceneAnnouncementRemove.action("cancel", async (ctx) => {
    deleteLastArchiveEntry();
    ctx.scene.enter("announcements");
})
sceneAnnouncementRemove.action("confirm", async (ctx) => {
    await deleteActiveAnnouncement();
    ctx.scene.enter("announcements");
})

// ----ADD--MEDIA----

const sceneAddMedia = new Scenes.BaseScene("add_media");
sceneAddMedia.enter(async (ctx) => {
    console.log("add media callback triggered!");
    ctx.reply("Which type of media are you uploading?", Markup.inlineKeyboard([
        Markup.button.callback("Back", "back"),
        Markup.button.callback("Images", "images"),
        Markup.button.callback("Videos", "videos")
    ]));
});
sceneAddMedia.action("images", (ctx) => { ctx.scene.enter("add_images") });
sceneAddMedia.action("videos", (ctx) => { ctx.scene.enter("add_videos") });

const sceneAddImages = new Scenes.BaseScene("add_images");
sceneAddImages.enter(async (ctx) => {
    console.log("add media callback triggered!");
    ctx.reply("Send me the images you'd like to upload...", Markup.inlineKeyboard([
        Markup.button.callback("Cancel", "cancel"),
        Markup.button.callback("Done!", "done")
    ]));
});

sceneAddImages.on('photo', async (ctx) => {
    console.log(ctx.message.photo[0].file_id);
    const fileId = ctx.message.photo[0].file_id;

    const file = await ctx.telegram.getFile(fileId);
    if (!file.file_path) {
        throw new Error('File path is undefined.');
    }
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    console.log(fileUrl);

    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
    });
    console.log('response:', response);

    const bucketName = "sealeon";
    const filePath = file.file_path;
    const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
    const destinationFileName = `${fileId}${fileExtension}`;
    const writeStream = storage.bucket(bucketName).file(destinationFileName).createWriteStream({
        contentType: response.headers['content-type']
    });

    response.data.pipe(writeStream)
    .on('error', (err) => {
        console.error('Error uploading to Google Cloud Storage:', err);
        ctx.reply('Failed to upload file.');
    })
    .on('finish', () => {
        console.log(`File uploaded to ${bucketName}/${destinationFileName}`);
        ctx.reply('File successfully uploaded.');
    });
});

const sceneAddVideos = new Scenes.BaseScene("add_videos");

//----WEB-CONTENT----
const sceneWebContent = new Scenes.BaseScene("web_content");
sceneWebContent.enter(async (ctx) => {

    ctx.reply("You can edit the content of your website from this menu. \n What would you like to do?", Markup.inlineKeyboard([
        Markup.button.callback("About", "about_sect"),
        Markup.button.callback("Hero", "hero_sect"),
        Markup.button.callback("Team", "team_sect"),
        Markup.button.callback("Service Cards", "service_sect"),
        Markup.button.callback("Back", "back")
    ]))
})

const myStages = new Scenes.Stage([sceneAnnouncement, sceneAnnouncementUpdate, sceneAnnouncementRemove, sceneAddMedia, sceneAddImages]);
bot.use(session());
bot.use(myStages.middleware());

bot.start(async (ctx) => {

    await setBotState(ctx.from.id, "main_menu");

    ctx.reply("Welcome back to your website dashboard, Mustafa. What would you like to do today?", Markup.inlineKeyboard(
        [[Markup.button.callback("Update Anoncement", botState.currentNodeChildren[0].id)],
        [Markup.button.callback("Add Media", "add_media")],
        [Markup.button.callback("Gallery", botState.currentNodeChildren[2].id)],
        [Markup.button.callback("Edit Website's Content", botState.currentNodeChildren[3].id)],
        [Markup.button.callback("Auth", "auth")]
        ]
    ))
});

bot.action("main_menu", async (ctx) => {
    await setBotState(ctx.from.id, "main_menu");

    ctx.reply("Welcome back to your website dashboard, Mustafa. What would you like to do today?", Markup.inlineKeyboard(
        [
            [Markup.button.callback("Update Anoncement", botState.currentNodeChildren[0].id)],
            [Markup.button.callback("Add Media", "add_media")],
            [Markup.button.callback("Gallery", botState.currentNodeChildren[2].id)],
            [Markup.button.callback("Edit Website's Content", botState.currentNodeChildren[3].id)]
        ]
    ))
});


bot.action("announcements", async (ctx) => { ctx.scene.enter('announcements') })
bot.action("add_media", async (ctx) => {ctx.scene.enter('add_media')});
bot.action("web_content", async (ctx) => {ctx.scene.enter("web_content")});
bot.launch();

async function setBotState(chatId, currentNodeId) {
    botState.userId = chatId;
    botState.currentNode = currentNodeId;
    botState.currentNodeElement = document.getElementById(botState.currentNode);
    botState.currentNodeChildren = botState.currentNodeElement.children;
    botState.currentNodeParent = botState.currentNodeElement.parentNode;
}

async function fetchActiveAnnouncement() {
    try {
        const queryString = "SELECT * FROM sl_announcement";
        return new Promise((resolve, reject) => {
            dbConnection.query(queryString, (error, results, fields) => {
                if (error) {
                    console.error("error when performing query: ", error);
                    reject(error);
                } else {
                    console.log("Fetched active announcement: ", results);
                    resolve(results);
                }
            })
        })
    } catch (error) { throw error }
}

async function archiveAnnouncement(ctx) {
    if (!ctx.session.this.activeAnnouncement) return;
    try {
        const currentDate = new Date(); // Format the current date to ISO string
        const formattedCurrentDate = formatDatetimeToMySQL(currentDate);
        const formattedSetAtDate = formatDatetimeToMySQL(ctx.session.this.activeAnnouncementSetAt); // Format the set at date to ISO string

        const queryString = `INSERT INTO sl_announcement_archive(announced_at, archived_at, announcement) VALUES (?, ?, ?)`;

        const values = [formattedSetAtDate, formattedCurrentDate, ctx.session.this.activeAnnouncement];

        return new Promise((resolve, reject) => {
            dbConnection.query(queryString, values, (error, results, fields) => {
                if (error) {
                    console.error("Error when performing query: ", error);
                    reject(error);
                } else {
                    console.log("Announcement archived: ", results);
                    resolve(results);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}


async function updateActiveAnnouncement(ctx) {
    try {
        const currentDate = new Date(); // Format the current date to ISO string
        const formattedCurrentDate = formatDatetimeToMySQL(currentDate);
        const queryString = `TRUNCATE TABLE sl_announcement; INSERT INTO sl_announcement (announced_at, announcement) VALUES (?, ?)`;

        const values = [formattedCurrentDate, ctx.session.this.newAnnouncement];

        return new Promise((resolve, reject) => {
            dbConnection.query(queryString, values, (error, results, fields) => {
                if (error) {
                    console.error("Error when performing query: ", error);
                    reject(error);
                } else {
                    console.log("Announcement updated: ", results);
                    resolve(results);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

async function deleteLastArchiveEntry() {
    try {
        const queryString = `DELETE FROM sl_announcement_archive ORDER BY id DESC LIMIT 1;`;
        return new Promise((resolve, reject) => {
            dbConnection.query(queryString, (error, results, fields) => {
                if (error) {
                    console.error("Error when performing query: ", error);
                    reject(error);
                } else {
                    console.log("Announcement updated: ", results);
                    resolve(results);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

async function deleteActiveAnnouncement() {
    const queryString = "TRUNCATE TABLE sl_announcement";

    return new Promise((resolve, reject) => {
        dbConnection.query(queryString, (error, results, fields) => {
            if (error) {
                console.error("Error when performing query: ", error);
                reject(error);
            } else {
                console.log("Announcement updated: ", results);
                resolve(results);
            }
        });
    });

}

function formatDatetimeToMySQL(datetime) {
    return datetime.toISOString().slice(0, 19).replace('T', ' ');
}