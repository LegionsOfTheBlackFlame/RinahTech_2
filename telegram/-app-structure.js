const tree = {
    main: {
        label: "main",
        message: "Welcome to the Telegram App",
        type: "menu",
        children: [
            {
                label: "Announcement",
                message: ["Your current announcement is: \n", {targetTable: "announcement", condition: "lang", value: 0}, "\n What would you like to change it to?"],
                type: "menu",
                children: [
                    {
                        label: "Update",
                        type: "form",
                        actions: [ ],
                        steps:[
                            {
                                label: "1",
                                message: ["Your current announcement is: \n", {targetTable: "announcement", condition: "lang", value: 0}, "\n What would you like to change it to?"]
                            },
                            {
                                label: "2",
                                message: ["are you sure you want to update your announcement to: \n", {target: "input"}]
                            },
                        ]
                        
                    },
                    {
                        label: "Remove",
                        message: ["Are you sure you want to remove this announcement?"],
                        type: "form",
                        Options: [ {label: "Cancel", type: "button", value: "cancel"}, {label: "Confirm", type: "button", value: "confirm"} ]   
        
                    }
                ]
            },

            {
                label: "Add Media",
                message: "This is the add media message",
                type: "menu",
                children: [
                ]
            },

            {
                label: "Gallery",
                message: "This is the gallery message",
                type: "menu",
                children: []
            },

            {
                label: "Current Content",
                message: "This is the current content message",
                type: "menu",
                children: [
                ]
            },
        ]
    }
}

export default tree;