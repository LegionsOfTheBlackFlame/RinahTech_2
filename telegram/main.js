import { Markup, Telegraf, session, Scenes, Context } from "telegraf";
// import Stage from "telegraf";
import  mysql from "mysql2";
import { google, marketingplatformadmin_v1alpha } from "googleapis";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";
import {JSDOM} from "jsdom";

dotenv.config();

// Database environment variables
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

// Establish connection to database
dbConnection.connect(error => {
    if (error) throw error;
    console.log("connected to database.");
});

// Initialize bot 
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);


const botState = {
    userId: 1,
    currentNode: "main_menu",
    currentNodeElement: {},
    currentNodeChildren: [],
    currentNodeParent: {}
}
const contentState = {
    content: []
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFilePath = path.join(__dirname, '-app-structure.html');
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;


const sceneAnnouncement = new Scenes.BaseScene('announcement');

sceneAnnouncement.enter(async (ctx) => {
    await setBotState(ctx.from.id, ctx.callbackQuery.data);
    ctx.session.this= {};
    const thisAnnouncement = await fetchActiveAnnouncement(ctx);
    ctx.scene.state.activeAnnouncement = thisAnnouncement[0].announcement;
    ctx.scene.state.activeAnnouncementSetAt = thisAnnouncement[0].announced_at;

    ctx.reply(`Your current announcement is: \n ${ctx.scene.state.activeAnnouncement}`, Markup.inlineKeyboard(
        [Markup.button.callback("Set new Announcement", botState.currentNodeChildren[0].id),
            Markup.button.callback("Remove Announcement", botState.currentNodeChildren[1].id),
            Markup.button.callback("View Archive", botState.currentNodeChildren[2].id),
            Markup.button.callback("Back", botState.currentNodeParent.id)
        ]
    ))
});

sceneAnnouncement.action("announcement_update", (ctx) => {
    ctx.scene.enter("announcement_update");
});

sceneAnnouncement.action("remove_announcement", (ctx) => {
    ctx.scene.enter("remove_announcement");
});

sceneAnnouncement.action("view_archive", (ctx) => {
    ctx.scene.enter("view_archive");
});



const sceneUpdateAnnouncement = new Scenes.WizardScene("announcement_update",
    (ctx) => {
        ctx.reply(`Current announcement: \n ${ctx.scene.state.activeAnnouncement} \n Please enter your new announcement...`);
        ctx.wizard.state.upadtedAnnouncement = "";
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.upadtedAnnouncement = ctx.message.text;
        archiveAnnouncement(ctx);
        ctx.reply(`Setting your new announcement to: \n \" ${ctx.wizard.state.upadtedAnnouncement} \"`, 
        Markup.inlineKeyboard([
            Markup.button.callback("Back", "back"),
            Markup.button.callback("Cancel", "cancel"),
            Markup.button.callback("Confirm", "confirm")
        ]));
        return ctx.scene.next();
    },
    (ctx) => {
        updateActiveAnnouncement(ctx);
        ctx.reply(`New announcement set:\n ${ctx.scene.state.upadtedAnnouncement}`);
        return ctx.scene.leave();
    }
);




bot.action("add_images", async (ctx) => {

})
bot.action("add_videos", async (ctx) => {

});
bot.action("about_sect", async (ctx) => {

})
bot.action("hero_sect", async (ctx) => {

})
bot.action("team_sect", async (ctx) => {

})
bot.action("service_sect", async (ctx) => {

})
const myStages = new Scenes.Stage([sceneAnnouncement, sceneUpdateAnnouncement]);
bot.use(session());
bot.use(myStages.middleware());

bot.start(async (ctx) => {
    
    await setBotState(ctx.from.id, "main_menu");

    ctx.reply("this is main menu", Markup.inlineKeyboard(
        [Markup.button.callback("Update Anoncement", botState.currentNodeChildren[0].id),
            Markup.button.callback("Add Media", botState.currentNodeChildren[1].id),
            Markup.button.callback("Gallery", botState.currentNodeChildren[2].id),
            Markup.button.callback("Edit Website's Content", botState.currentNodeChildren[3].id)
        ]
    ))
});

bot.action("main_menu", async (ctx) => {
    await setBotState(ctx.from.id, "main_menu");

    ctx.reply("this is main menu", Markup.inlineKeyboard(
        [Markup.button.callback("Update Anoncement", botState.currentNodeChildren[0].id),
            Markup.button.callback("Add Media", botState.currentNodeChildren[1].id),
            Markup.button.callback("Gallery", botState.currentNodeChildren[2].id),
            Markup.button.callback("Edit Website's Content", botState.currentNodeChildren[3].id)
        ]
    ))
});

bot.action("announcements", async (ctx) => { ctx.scene.enter('announcement');});

bot.action("add_media", async (ctx) => {

});
bot.action("gallery", async (ctx) => {

});
bot.action("web_content", async (ctx) => {
    
});



bot.launch();

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
    } catch (error) { throw error}
}

async function archiveAnnouncement(ctx) {
    try {
        const currentDate = new Date();
        const queryString = `INSERT INTO sl_announcement_archive VALUES ${ctx.scene.state.activeAnnouncementSetAt}, ${currentDate}, ${ctx.scene.state.activeAnnouncement}`;
        
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
    } catch(error) {
        throw error;
    }
}

async function updateActiveAnnouncement(ctx) {
 try {
        const currentDate = new Date();
        const queryString = `INSERT INTO sl_announcement VALUES ${currentDate}, ${ctx.scene.state.upadtedAnnouncement}`;
        
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
    } catch(error) {
        throw error;
    }
}
async function setBotState(chatId, currentNodeId) {
    botState.userId = chatId;
    botState.currentNode = currentNodeId;
    botState.currentNodeElement = document.getElementById(botState.currentNode);
    botState.currentNodeChildren = botState.currentNodeElement.children;
    botState.currentNodeParent = botState.currentNodeElement.parentNode;
}

async function setContentState(key, value) {
    contentState.key = value;
}
/* "Welcome back! what can I do for you today?"*/
// GALLERY

    // View gallery content
        /*  --Sort
            --Filter
            --(selected) Remove
            --(selected) View
            */

    // Add to gallery
    /* "What type of media would you like to add to your gallery?" */

        /*  --Video
                "Send me the video you'd like to upload to your youtube channel..."
                    --Back
                > Wait for file
                "What's the title of this video?"
                    --Back
                    --Cancel
                > Wait for response
                "Send me the description of this video..."
                    --Back
                    --Cancel
                > Wait for response
                "Uploading ${Video Title} to ${Channel name}. Please wait..."
                >Upload video
                "Adding ${video title} to ${playlist name}. Please wait..."
                >Add to playlist
                "Video added: ${link to video}"
                "^..."
            
            --Image
                "Send me The images you'd like to upload to the cloud..."
                    --Back
                >Wait for Files (debounce next response)
                "Recieved ${number of files}. Send more or select done."
                    --Cancel
                    --Done
                >Listen for files or response
                "^..." + --Back
                "${number of images} images added to the cloud."
                ^
            */
    

// ANNOUNCEMENTS
    // View current announcement banner
        /*  >Fetch from db
            "Your current banner is: ${current banner}" + ^
            */
    // Update announcement banner
        /*  >Archive Banner
            "What's the new announcement?"
                --Cancel
            >Wait for input
            >Update db
            "Announcement banner updated to: ${current banner}" + ^
            */
    // Remove announcement banner
        /*  "Are you sure you want to remove the announcement?"
                --Yes
                --Cancel
            >Archive banner
            >Update db
            "You've removed the announcement banner" + ^
            */
    // View announcements' history
        /*  >Fetch from db
            >Send to user
                --Back
            */

// CURRENT SPECIAL
    /* "${special}"
        --Back
        --Update
        --View Archive */
        
    //Update current special
        /* "Send the title"
            --Cancel
            --Keep title as is
        > wait for response
        "New Title set: ${special card}. Send the content"
            --Back
            --Keep content as is
            --Cancel
        > wait for response
        "new description added. ${speial card}. Send the new image"
            --Back
            --Keep image as is
            --Cancel
        > wait for response
        "Image updated. ${special card}. Please confirm the changes"
            --Back
            --Confirm
            --Cancel */
    //View current special's history
        /*  >Fetch from db
            >Send to user */

// CONTENT
    //Hero section
        /* ${Hero Section}
            --Back
            --Expand
            --Edit
            --View section's history
            */

        //Update hero section
            /* "Editing the hero section of sealeon.com. What would you like to change?"
                --Change title
                --Change Content
                --Change image
                > wait for response
                "Changing ${Selected part}. Please send the new ${selected part}"
                    --Back
                
                "Changing the content. Send me the first paragraph"
                    --Cancel
                > wait for content
                "Recieved the first paragraph"
                    --Back
                    --Add paragraph
                    --Done
                    --Cancel
                "Updated hero content: ${hero sect}. Confirm the changes."
                    --Back
                    --Cancel
                    --Confirm
                    */
        //View hero section history
    
    //About section
        //View
        //Edit
        //View Archive
    
    //Team section
        //List team members
        //View team member content
        //Edit team member content
    
    //Services section
        //List all service cards
        //View a service card's content
        //Edit a service card's content
        //View a service card's history


// >Back button


/*
>> if it contains operation modules, it's a menu
>> if it contains operation steps, it's an operation


*/




function cancel(){}

function uploadToYoutube() {}

function uploadToCloudStorage() {}

function updateAnnouncementBanner() {}

function updateServiceCard() {}

function updateHeroSection() {}

function renderElement() {}

function fetchFromDatabase() {}

