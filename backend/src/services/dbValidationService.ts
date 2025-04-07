import path from 'node:path';
import fs from 'node:fs';
import pool from '../database/db';
import { NAME_FILES_DATA_ALLOWED } from '../constants/constant';

/**
 * Health app table validation service
 */
class DbValidationService {
  requiredTables;

  constructor() {
    this.requiredTables = NAME_FILES_DATA_ALLOWED;
  }

  /**
   * Check if all required tables exist
   * @returns {Promise<Object>} Map of table names with existence status
   */
  async validateTables() {
    try {
      console.log(`🔍 Validating health app tables at 2025-04-07 01:24:18`);
      console.log(`👤 Current user: wilmer2000`);

      // Query to check if tables exist
      const tablesQuery = `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = ANY ($1)
      `;

      const { rows } = await pool.query(tablesQuery, [this.requiredTables]);

      // Map existing tables to true
      const existingTables = new Set(rows.map(row => row.table_name));

      // Create result object showing which tables exist
      const result = {};
      this.requiredTables.forEach(tableName => {
        result[tableName] = existingTables.has(tableName);
      });

      // Display status in console
      console.log('📋 Table validation results:');
      console.table(result);

      // Calculate summary
      const total = this.requiredTables.length;
      const existing = rows.length;
      const missing = total - existing;

      console.log(`📊 Found ${existing}/${total} tables (${missing} missing)`);

      return result;
    } catch (error) {
      console.error('❌ Error validating tables:', error);
      throw error;
    }
  }

  /**
   * Create all required tables
   * @returns {Promise<void>}
   */
  async createTables() {
    try {
      console.log(`🔄 Creating missing health app tables at 2025-04-07 01:24:18`);
      console.log(`👤 Current user: wilmer2000`);

      // Read the SQL schema file
      const schemaPath = path.join(__dirname, '../database/query/health_tables.sql');
      const sqlScript = fs.readFileSync(schemaPath, 'utf8');

      // Execute the SQL script
      await pool.query(sqlScript);

      console.log('✅ Tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Validate and create tables if needed
   * @returns {Promise<void>}
   */
  async validateAndCreateTables() {
    try {
      // First, check which tables exist
      const tableStatus = await this.validateTables();

      // Check if any tables are missing
      const missingTables = Object.entries(tableStatus)
        .filter(([_, exists]) => !exists)
        .map(([tableName]) => tableName);

      if (missingTables.length === 0) {
        console.log('✅ All required health app tables exist');
        return;
      }

      // If there are missing tables, create them
      console.log(`⚠️ Missing tables: ${missingTables.join(', ')}`);
      await this.createTables();

      // Verify tables were created
      const updatedStatus = await this.validateTables();
      const stillMissing = Object.entries(updatedStatus)
        .filter(([_, exists]) => !exists)
        .map(([tableName]) => tableName);

      if (stillMissing.length === 0) {
        console.log('✅ All health app tables are now available');
      } else {
        console.error(`❌ Failed to create some tables: ${stillMissing.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error in table validation process:', error);
      throw error;
    }
  }
}

export default new DbValidationService();