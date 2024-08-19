import { Markup, Telegraf, session, Scenes, Context } from "telegraf";
import axios from "axios";
import mysql from "mysql2";
import { Storage } from "@google-cloud/storage";
import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import { JSDOM } from "jsdom";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

//Database environment variables
const dbConnection = mysql.createConnection({
    host: process.env.MYSQL_DATABASE_HOST ,
    user: process.env.MYSQL_DATABASE_USER ,
    password: process.env.MYSQL_DATABASE_PASSWORD ,
    database: process.env.MYSQL_DATABASE_NAME ,
    multipleStatements: true
});

// Establish connection to database
dbConnection.connect(error => {
    if (error) throw error;
    console.log("connected to database.");
});

const keyPath = './Google-ServiceAccountAuth.json';

async function googleAuth() {
    const auth = new GoogleAuth({
        keyFile: keyPath,
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });

    const client = await auth.getClient();
    return new Storage({ auth: client });
};
const storage = await googleAuth();

const botState = {
    userId: 1,
   currentMenu: '',
   menuHistory: []
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFilePath = path.join(__dirname, '-app-structure.html');
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// ----ANNOUNCEMENTS----
const sceneAnnouncement = new Scenes.BaseScene("announcements");

    // --- Main Announcement Menu ---
sceneAnnouncement.enter(async (ctx) => {
    
    ctx.session.this = {};
    
    const thisAnnouncement = await fetchActiveAnnouncement();
    
    ctx.session.this.activeAnnouncement = thisAnnouncement[0] ?
     thisAnnouncement[0].announcement : "";
    ctx.session.this.activeAnnouncementSetAt = thisAnnouncement[0] ?
     thisAnnouncement[0].announced_at : "";
    
     ctx.reply(`Current announcement: 
        \n ${ctx.session.this.activeAnnouncement}\n 
        \n What would you like to do?`,
        Markup.inlineKeyboard([
        Markup.button.callback('Update Announcement', 'update'),
        Markup.button.callback('Remove Announcement', 'remove'),
        Markup.button.callback('View Archive', 'view_archive'),
        Markup.button.callback('Back', `back`)
    ]));
});


sceneAnnouncement.action('view_archive', (ctx) => {
    ctx.scene.enter('view_archive');
});
const sceneAnnouncementArchive =  new Scenes.BaseScene('view_archive');

sceneAnnouncementArchive.enter((ctx) => {
    ctx.reply('Announcement Archive is under development...');
})

    // --- Update Announcemnet Menu ---
sceneAnnouncement.action('update', (ctx) => {
    ctx.scene.enter('update_announcement')});
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
    // --- Remove Announcement Menu ---
sceneAnnouncement.action('remove', (ctx) => {
    ctx.scene.enter('remove_announcement')});
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
    // --- View Announcement Archive Menu ---
    // --- Back Button ---

// ----ADD--MEDIA----

const sceneAddMedia = new Scenes.BaseScene("add_media");

    // --- Media Main Menu
sceneAddMedia.enter(async (ctx) => {
    console.log("add media callback triggered!");
    ctx.reply("Which type of media are you uploading?", 
        Markup.inlineKeyboard([
        Markup.button.callback("Back", "back"),
        Markup.button.callback("Images", "images"),
        Markup.button.callback("Videos", "videos")
    ]))});

sceneAddMedia.action("videos", (ctx) => { ctx.scene.enter("add_videos") });

    // --- Images Menu ---
    sceneAddMedia.action("images", 
        (ctx) => { ctx.scene.enter("add_images") });
const sceneAddImages = new Scenes.BaseScene("add_images");
sceneAddImages.enter(async (ctx) => {
console.log ("add media callback triggered!");
    ctx.reply("Send me the images you'd like to upload...", Markup.inlineKeyboard([
        Markup.button.callback("Cancel", "cancel"),
        Markup.button.callback("Done!", "done")
    ]))
})
const bucketName = "sealeon"
sceneAddImages.on('photo', async (ctx) => {
    console.log("-recieved message", ctx.message);
    const fileId = ctx.message.photo[0].file_id;
   

    const file = await ctx.telegram.getFile(fileId);
    if (!file.file_path) {
        throw new Error('! File path is undefined. Current File: ', file);
    }
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const response = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
    });

    const writeStream = await storage.bucket(bucketName).file(fileId).createWriteStream();

    response.data.pipe(writeStream)
    .on('error', (err) => {
        console.error('Error uploading to Google Cloud Storage:', err);
        ctx.reply('Failed to upload file.');
    })
    .on('finish', () => {
        console.log(`File uploaded to ${bucketName}/${fileName}`);
        ctx.reply('File successfully uploaded.');
    });
});


const sceneAddVideos = new Scenes.BaseScene("add_videos");
sceneAddVideos.enter((ctx) => {
    ctx.reply("Video adding functionality is under development...");
});

const sceneCurrentContent = new Scenes.BaseScene("current_event_menu");
sceneCurrentContent.enter(async (ctx) => {
    ctx.session.this = {};
    ctx.session.this.content = await fetchWebContent("current");
    ctx.reply(`Your current event is: \n
        ${ctx.session.this.content.find(item => item.field === "title").content_value} \n \n
        (1): ${ctx.session.this.content.find(item => item.field === "paragraph 1").content_value} \n \n
        (2): ${ctx.session.this.content.find(item => item.field === "paragraph 2").content_value} \n \n
        (3): ${ctx.session.this.content.find(item => item.field === "paragraph 3").content_value} \n \n
        (4): ${ctx.session.this.content.find(item => item.field === "paragraph 4").content_value}`, Markup.inlineKeyboard([
        Markup.button.callback("Update", "current_update"),
        Markup.button.callback("Edit", "current_edit"),
        Markup.button.callback("Back", "back")
    ]));
});

sceneCurrentContent.action("current_update", (ctx) => {
    ctx.scene.enter("current_content_update");
});
const sceneCurrentContentUpdate = new Scenes.BaseScene("current_content_update");
sceneCurrentContentUpdate.enter((ctx) => {

    ctx.reply("You're updating your current event \n Send me the title", Markup.inlineKeyboard([
        Markup.button.callback("Keep existing title"),
        Markup.button.callback("Cancel", "cancel")
    ]));
});

//----WEB-CONTENT----
const sceneWebContent = new Scenes.BaseScene("web_content");
sceneWebContent.enter(async (ctx) => {

    ctx.reply("You can edit the content of your website from this menu. \n What would you like to do?", Markup.inlineKeyboard([
        Markup.button.callback("About", "about_sect"),
        Markup.button.callback("Hero", "hero_sect"),
        Markup.button.callback("Team", "team_sect"),
        Markup.button.callback("Service Cards", "service_sect")
    ]));
});

sceneWebContent.action('about_sect', (ctx) => {
    ctx.scene.enter('web_about_sect');
});
const sceneWebAboutSect = new Scenes.BaseScene('web_about_sect');
sceneWebAboutSect.enter( async (ctx) => {
    ctx.session.this = {};
    ctx.session.this.aboutContent = await fetchWebContent('about');
    ctx.reply(`Your current about section reads: \n ${ctx.session.this.aboutContent.find(item => item.field === "title").content} 
    \n (1): ${ctx.session.this.aboutContent.find(item => item.field === "paragraph 1").content}
    \n (2): ${ctx.session.this.aboutContent.find(item => item.field === "paragraph 2").content}
    \n (3): ${ctx.session.this.aboutContent.find(item => item.field === "paragraph 3").content}
    \n (4): ${ctx.session.this.aboutContent.find(item => item.field === "paragraph 4").content}`);
});

sceneWebContent.action('hero_sect', (ctx) => {
    ctx.scene.enter('web_hero_sect');
});
const sceneWebHeroSect = new Scenes.BaseScene('web_hero_sect');
sceneWebHeroSect.enter(async (ctx) => {
    const heroContent = await fetchWebContent('hero');
    ctx.reply("Hero section is under development...");
});

sceneWebContent.action('team_sect', (ctx) => {
    ctx.scene.enter('web_team_sect');
});
const sceneWebTeamSect = new Scenes.BaseScene('web_team_sect');
sceneWebTeamSect.enter(async (ctx) => {
    const mustafaTeamContent = await fetchWebContent('team_mustafa');
    const yucelTeamContent = await fetchWebContent('team_yucel');
    ctx.reply("Team section is under development...");
});

sceneWebContent.action('service_sect', (ctx) => {
    ctx.scene.enter('web_service_sect');
});
const sceneWebServiceSect =  new Scenes.BaseScene('web_service_sect');
sceneWebServiceSect.enter(async (ctx) => {
    ctx.session.this.serviceCardsContent = await fetchWebContent('service_cards');
    ctx.reply("Which card would you like to edit?", Markup.inlineKeyboard([
        Markup.button.callback('Organisations', 'service_orgs'),
        Markup.button.callback('Locations', 'service_locs'),
        Markup.button.callback('Activities', 'service_acts'),
        Markup.button.callback('Current Event', 'service_cur')
    ]));
});

sceneWebServiceSect.action('service_orgs', (ctx) => {
    ctx.scene.enter('service_orgs_sect');
});
const sceneServiceOrgSect = new Scenes.BaseScene('service_orgs_sect');
sceneServiceOrgSect.enter((ctx) => {
    ctx.reply('Editing organisation card content...')
});



const myStages = new Scenes.Stage([ 
    sceneAnnouncement, 
    sceneAnnouncementUpdate, 
    sceneAnnouncementRemove, 
    sceneAnnouncementArchive,
    sceneAddMedia, 
    sceneAddImages, 
    sceneAddVideos,
    sceneCurrentContent]);
bot.use(session());
bot.use(myStages.middleware());

bot.start(async (ctx) => {

    await setBotState(ctx.from.id, "main_menu");

    ctx.reply("Welcome back to your website dashboard, Mustafa. What would you like to do today?", Markup.inlineKeyboard(
        [[Markup.button.callback("Update Anoncement", botState.currentNodeChildren[0].id)],
        [Markup.button.callback("Add Media", "add_media")],
        [Markup.button.callback("Gallery", botState.currentNodeChildren[2].id)],
        [Markup.button.callback("Current Event", botState.currentNodeChildren[3].id)]
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
            [Markup.button.callback("Current Event", botState.currentNodeChildren[3].id)]
        ]
    ))
});
// each Scene

bot.action("announcements", async (ctx) => { ctx.scene.enter('announcements') });
bot.action("web_content", async (ctx) => { ctx.scene.enter('web_content')});
bot.action("add_media", async (ctx) => {ctx.scene.enter('add_media')});
bot.action("current_event_menu", async (ctx) => { ctx.scene.enter('current_event_menu')});
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
async function translateActiveAnnouncement(content) {


    return translatedContent;
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

async function fetchWebContent(section) {
    const queryString = `select * from sl_${section} where lang=0`;
    try {
        return new Promise((resolve, reject) => {
            dbConnection.query(queryString, (error, results, fields) => {
                if (error) {
                    console.error("Couldn't fetch web content. ", error);
                    reject(error);
                } else {
                    console.log(" Fetched web content. ");
                    resolve(results);
                }
            })
        })
    } catch (error) {
        throw error;
    }
}

function formatWebContent(content) {

}

async function updateWebContent(content, field, language) {

}

function formatDatetimeToMySQL(datetime) {
    return datetime.toISOString().slice(0, 19).replace('T', ' ');
}