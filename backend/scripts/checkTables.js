#!/usr/bin/env node
const dbValidationService = require('../services/dbValidationService');
const {pool} = require('../database/database');

/**
 * Run validation manually from command line
 */
async function main() {
    try {
        console.log('🏥 Health App Database Table Checker');
        console.log(`⏱️  Current time: 2025-04-07 01:24:18 (UTC)`);
        console.log(`👤 User: wilmer2000`);
        console.log('-------------------------------------------');

        await dbValidationService.validateAndCreateTables();

        console.log('-------------------------------------------');
        console.log('✅ Table validation complete');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        // Close the database connection
        if (pool && typeof pool.end === 'function') {
            await pool.end();
        }
    }
}

// Run the script
main().then();