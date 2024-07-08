import mySql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Database environment variables
const dbPool = mySql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

// Establish connection to database
async function dbPoolQuery( queryString, values, callback) {
    const connection = await dbPool.getConnection();
    return connection.query(queryString, values)
    .then(([rows, fields]) => {
        return callback(null, rows, fields);
    }).catch((error) => {
        return callback(error, null, null);
    }).then((r) => {
        connection.release();
        return r;
    })
}

export {dbPoolQuery};

//store OAuth2' access and refresh tokens
function dbStoreTokens(accessToken, refreshToken, tokenType, expiresIn, encryptedIV) {

    //calculate token expiration date
    
    const expiryDate = new Date(expiresIn);
    const queryString = 'INSERT INTO sl_tokens (tkn_access, tkn_refresh, tkn_type, tkn_expires_in, tkn_expiry_date, tkn_encrypted_iv) VALUES (?,?,?,?,?,?)';
    const values = [accessToken, refreshToken, tokenType, expiresIn, expiryDate, encryptedIV];

    //push values into database
    dbPoolQuery(queryString, values, (error, results, fields) => {
        if (error) throw error;
        // console.log('saved token in database: ', results.insertId);
    })
}

export {dbStoreTokens};

// Fetch Google reviews
async function dbFetchGoogleReviews() {
  
        const queryString = `SELECT Id, Score, User_name, User_image_url, Original_text, Published_at_datetime, Pictures FROM sl_google_reviews`;
        
        return new Promise((resolve, reject) => {
            dbPoolQuery(queryString, null, (error, results, fields) => {
                if (error) {
                    console.error("error when performing query: ", error);
                    reject(error);
                } else {
                    // console.log("Fetched google reviews: ", results);
                    resolve(results);
                }
            })
        })
}

export {dbFetchGoogleReviews};
async function dbFetchAnnouncementContent() {
    const queryString = "SELECT * FROM sl_announcement";
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}

export {dbFetchAnnouncementContent};
async function dbFetchServiceCardContent() {
    const queryString = "SELECT * FROM sl_service_cards";
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}
 
export {dbFetchServiceCardContent};

async function dbFetchHeroContent(lang) {
    const queryString = `SELECT * FROM sl_hero WHERE lang=${lang}`;
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}

export {dbFetchHeroContent}

async function dbFetchTeamMustafa(lang) {
    const queryString = `SELECT * FROM sl_team_mustafa WHERE lang=${lang}`;
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}
export {dbFetchTeamMustafa};

async function dbFetchLocsContent(lang) {
    const queryString = `SELECT * FROM sl_locations WHERE lang=${lang}`;
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}

export {dbFetchLocsContent};
async function dbFetchOrgsContent(lang) {
    const queryString = `SELECT * FROM sl_organizations WHERE lang=${lang}`;
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}

export {dbFetchOrgsContent};
async function dbFetchActivitiesContent(lang) {
    const queryString = `SELECT * FROM sl_activities WHERE lang=${lang}`;
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}
export {dbFetchActivitiesContent}

async function dbFetchAboutContent(lang) {
const queryString = `SELECT * FROM sl_about WHERE lang=${lang}`;
return new Promise((resolve, reject) => {
    dbPoolQuery(queryString, null, (error, results, fields) => {
        if (error) {
            console.error("error performing query: ", error)
            reject(error);
        } else {
            resolve(results);
        }
    })
})
}

export {dbFetchAboutContent}
async function dbFetchTeamYucel(lang) {
    const queryString = `SELECT * FROM sl_team_yucel WHERE lang=${lang}`;
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("Fetched google reviews: ", results);
                resolve(results);
            }
        })
    })
}

export {dbFetchTeamYucel};
//fetch value from specific column
function dbFetchSingular(columnName, tableName) {
//  console.log('running fetch singular');
    const queryString = `SELECT ${columnName} FROM ${tableName}`;
    // console.log("the query string: ", queryString);
    
    return new Promise((resolve, reject) => {
        dbPoolQuery(queryString, null, (error, results, fields) => {
            if (error) {
                console.error("error when performing query: ", error);
                reject(error);
            } else {
                // console.log("singular fetch query done: ", results);
                resolve(results);
            }
        })
    })
};

export {dbFetchSingular};

