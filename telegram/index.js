import { Markup, Telegraf, session } from "telegraf";
import appStructure from "./-app-structure.js";
import FlowHandler from "./flowHandler.js";
import dotenv from "dotenv";

console.group("Initializing bot...");
dotenv.config();


const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.use(session()); 

bot.start(async (ctx) => {
    console.group("Received start command...");
    try {
        if (!ctx.session) ctx.session = {};
        if (!ctx.session.this) ctx.session.this = {};
        // state is bot level this.node.label
        ctx.session.this.state = "main";
        ctx.session.this.handler = new FlowHandler(appStructure);
        
        // sets core stables  
        await ctx.session.this.handler.activate(ctx.session.this.state);

        const response = await ctx.session.this.handler.getResponse();
        console.log("Response message:", response);

        const options = ctx.session.this.handler.setOptions(ctx.session.this.state);
        const buttons = ctx.session.this.handler.makeButtons();
        console.log("Options:", options, "Buttons:", buttons);

        if (buttons.length > 0) {
            await ctx.reply(response, Markup.inlineKeyboard(buttons.map(
                button => Markup.button.callback(button.text, button.data)
            )));
        } else {
            await ctx.reply(response);
        }
    } catch (error) {
        console.error("Error in start handler:", error);
    }
    console.groupEnd();
});

bot.action(/.*/, async (ctx) => {
    console.group("Handling action callback...");
    try {
        if (ctx.session && ctx.session.this && ctx.callbackQuery) {
            console.log("Session data:", ctx.session.this);

         

            let { message, buttons } = await ctx.session.this.handler.processAction(ctx.callbackQuery.data);
            console.log("Response message:", message);
            console.log( "Buttons:", buttons);

            if (buttons.length > 0) {
                await ctx.reply(message, Markup.inlineKeyboard(buttons.map(
                    button => Markup.button.callback(button.text, button.data)
                )));
            } else {
                await ctx.reply(message);
            }
        }
    } catch (error) {
        console.error("Error in action handler:", error);
    }
    console.groupEnd();
});

bot.on('text', async (ctx) => {
    console.group("Handling text callback...");
    try {
        if (ctx.session && ctx.session.this && ctx.message.text) {
            ctx.session.this.handler.incrStep();
            ctx.session.this.handler.saveInput(ctx.message.text);
            ctx.session.this.handler.getResponse(ctx.session.this.state);

        }
    } catch (error) {
        console.error("Error handling text:", error);
    }
    console.groupEnd();
});

bot.launch();
