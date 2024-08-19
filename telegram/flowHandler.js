import DatabaseHandler from "./fnDatabase.js";

class FlowHandler {

    constructor(tree) {
        console.group("Initializing FlowHandler...");
        this.tree = tree;
        this.node = null;
        this.input = "";
        this.record = {};

        this.database = new DatabaseHandler();
        console.groupEnd();
    }

    async activate(state) {
        console.log("Activating FlowHandler with state:", state);
        this.node = this.getCurrentNode(state);
        this.node.message = "";
        this.node.options = [];
        this.node.buttons = [];
        this.node.response = {};
        this.history = [];
        await this.database.activate();
    }

    async processAction(queryData) {
        // update this.node
       this.setNode(queryData);
        // Check this.node.type
        switch (this.node.type) {

             // if menu : getresponse
            case "menu":
                this.node.response = await this.getResponse();
                console.log("Menu response:", this.node.response);
                return this.node.response;

             // if form : init form && set this.node to this.node.steps[0] re run processNode
            case "form":
                this.node.response = await this.initForm();
                break;

             // if step : getResponse
            case "step":
                this.node.response = await this.getResponse();
                break;


            case "util":
                await this.getResponse();
                break;
            default:
                console.error("Invalid node type:", this.node.type);
                break;
        }
       
        
        
        // if util : ...
    }

    async getResponse() {
       await this.getMessage(); 
       this.setOptions();
       this.addUtils
       this.makeButtons();


        return {
           message: this.node.message,
           buttons: this.node.buttons
        }
    }

    async initForm() {

    }

    getCurrentNode(state) {
        console.log("Finding node for state:", state);
        if (this.node) {
            return this.node.children.find(child => child.label === state);
        } else {
            console.log("Initializing node from tree");
            return this.tree[state];
        }
    }

    setNode(queryData) {
        console.group("Setting node with queryData:", queryData);
        if (this.node) this.history.push(this.node.label);
        this.node = this.getCurrentNode(queryData);
        console.log("Updated node:", this.node);
        console.groupEnd();
        return this.node;
    }

    setOptions() {
        //

        console.log("Setting options...");
        
        console.log("Node:", this.node);

        this.node.options = (this.node.children || []).map(child => child.label);
        if (this.node.steps && this.node.steps[this.step] && this.node.steps[this.step].attachments) {
            this.node.options.push(...this.node.steps[this.step].attachments.map(att => att.label));
        }
        if (this.node.attachments) {
            this.nodeoptions.push(...this.node.attachments);
        }

        console.log("Found options:", this.node.options);
        return this.nodeoptions;
    }

    addUtils() {
        const utils = [];
/*   1 > this.node.label === "main" { return }
        2 > this.node.type !=== "stage" { + BACK }
            3 > this.node.parent.stages.LastIndexOf() === this.node { + BACK, CANCEL, CONFIRM }
                4 > this.node.parent.stages[0] === this.node { + CANCEL }
                    5 > else { + CANCEL, BACK } */
        this.node.options.push(...utils);
    }

    makeButtons() {
        console.log("Creating buttons from options:", this.options);
       return this.node.buttons = this.node.options.map(option => ({ text: `${option}`, data: `${option}` })); 
    }

    async getMessage() {
        console.group("Parsing response message for node:", this.node.label);
        let message = '';

        if (typeof this.node.message === "string") {
            message = this.node.message;
        } else if (Array.isArray(this.node.message)) {
            for (let item of this.node.message) {
                if (typeof item === "string") {
                    message += item;
                } else if (typeof item === "object") {
                    try {
                        if (item.target === "input") {
                            message += this.input;
                        } else {
                            const data = await this.requestData(item);
                            const dataString = data.map(row => row[item.targetTable]).join("\n");
                            message += dataString;
                        }
                    } catch (error) {
                        console.error("Error fetching message data:", error);
                    }
                }
            }
        }

        console.log("Final message:", message);
        this.node.message = message;
    }

    async requestData(args) {
        const { targetTable, condition, value } = args;
        try {
            const results = await this.database.getData({ targetTable, condition, value });
            return results;
        } catch (error) {
            console.error("Error in requestData:", error);
            throw error;
        }
    }
    incrStep() {
        this.step += 1;
    }
    saveInput(input) {
        this.input = input;
    }
}

export default FlowHandler;
