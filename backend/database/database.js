const {Pool} = require('pg');
require('dotenv').config();

// Create a connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

// Check if the 'user' table exists, if not, create it
const checkAndCreateUserTable = async () => {
    // user_member_profile Table
    const userTableExistsQuery = `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_member_profile');`;


    const result = await pool.query(userTableExistsQuery);
    const userTableExists = result.rows[0].exists;

    if (!userTableExists) {
        try {
            const createUserTableQuery = `
                CREATE TABLE "user_member_profile"
                (
                    id           SERIAL PRIMARY KEY,
                    username     TEXT NOT NULL,
                    password     TEXT NOT NULL,
                    email        TEXT UNIQUE,
                    name         TEXT,
                    sex          TEXT,
                    birth        DATE,
                    height       NUMERIC,
                    weight       NUMERIC,
                    relation     TEXT,
                    uid          TEXT,
                    region       TEXT,
                    special_mark TEXT,
                    icon         TEXT
                );
            `;

            await pool.query(createUserTableQuery);

            const userAdminQuery = `
                INSERT INTO "user_member_profile" (username, password)
                VALUES ('admin', 'admin');
            `
            await pool.query(userAdminQuery);

            console.log('Created new table: user');
        } catch (error) {
            console.error(error);
        }
    }
};

checkAndCreateUserTable().then();

module.exports = {pool};