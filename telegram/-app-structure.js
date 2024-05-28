const appStructure = {
    MAIN_MENU: {
        id: "",

        ANNOUNCEMENT: {
            UPDATE: {
                await_input: "",
                confirm_resolve: ""
            },
            REMOVE: {
                confirm_request: "",
                confirm_resolve: ""
            },
            VIEW_ARCHIVE: {
                list_archive: ""
            }
        },

        ADD_MEDIA: {
            IMAGE: {
                await_files: "",
                checkpoint: "",
                confirm_resolve: ""
            },
            VIDEO: {
                await_file: "",
                await_title: "",
                await_description: "",
                confirm_resolve: ""
            }
        },

        GALLERY: {

        },

        WEB_CONTENT: {
            ABOUT_SECT: {},
            HERO_SECT: {},

            TEAM_SECT: {

                TEAM: {

                    ADD_CONTENT: {
                        await_selection: "",
                        await_content: "",
                        confirm_request: "",
                        confirm_resolve: ""
                    },

                    REMOVE_CONTENT: {
                        await_selection: "",
                        confirm_request: "",
                        confirm_resolve: ""
                    },

                    EDIT_CONTENT: {
                        await_selection: "",
                        await_content: "",
                        confirm_request: "",
                        confirm_resolve: ""
                    }
                }
            },

            SERVICE_SECT: {
                CARD: {
                    await_title: "",
                    await_content: "",
                    await_file: "",
                    confirm_request: "",
                    confirm_resolve: ""
                }
            }
        }
    }
}