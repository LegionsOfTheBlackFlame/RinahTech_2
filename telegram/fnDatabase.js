import mysql from "mysql2/promise";
import { configDotenv } from "dotenv";  
configDotenv();

class DatabaseHandler {
    constructor() {
        this.pool = null;
    }

    async activate() {
        this.pool = await this.initPool();
    }

    async initPool() {
        console.log("Initializing database pool...");
        try {
            this.pool = mysql.createPool({
                host: process.env.MYSQL_DATABASE_HOST,
                user: process.env.MYSQL_DATABASE_USER,
                password: process.env.MYSQL_DATABASE_PASSWORD,
                database: process.env.MYSQL_DATABASE_NAME,
                multipleStatements: true,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
            });
            console.log("Database pool initialized.");
        } catch (error) {
            console.error("Error initializing database pool:", error);
        }
        return this.pool;
    }

    async reqConnection() {
        try {
            console.log("Requesting database connection...");
            const connection = await this.pool.getConnection();
            console.log("Connection acquired.");
            return connection;
        } catch (error) {
            console.error("Error requesting connection:", error);
            throw error;
        }
    }

    async getData(args) {
        let connection;
        try {
            connection = await this.reqConnection();
            const queryString = `SELECT * FROM sl_${args.targetTable} WHERE ${args.condition}=${args.value}`;
            console.log("Executing query:", queryString);
            const [results] = await connection.query(queryString);
            console.log("Query results:", results);
            return results;
        } catch (error) {
            console.error("Database error:", error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    }
}

export default DatabaseHandler;