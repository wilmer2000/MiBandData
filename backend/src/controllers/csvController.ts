import csvProcessingService from '../services/csvProcessingService';
import tableMapper from '../services/tableMapperService';
import fs from 'node:fs';
import path from 'node:path';

// Handle upload and import of CSV files
const importCsvFiles = async (req, res) => {
  try {
    const { files, batchId } = req;
    const username = req.user.username || 'wilmer2000';

    console.log(`📦 Received ${files.length} files in batch ${batchId}`);
    console.log(`⏱️ Current time: 2025-04-07 02:17:31 (UTC)`);
    console.log(`👤 User: ${username}`);

    // Process files and insert into database
    const result = await csvProcessingService.processBatch(files, username);

    // Send response
    res.status(200).json({
      status: 'success',
      message: 'CSV import complete',
      batchId,
      ...result,
      timestamp: '2025-04-07 02:17:31',
      user: username,
    });

    // Clean up files in background (optional)
    cleanupFiles(files);

  } catch (error) {
    console.error('❌ Error importing CSV files:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error importing CSV files',
      error: error.message,
      timestamp: '2025-04-07 02:17:31',
      user: 'wilmer2000',
    });
  }
};

// Utility function to clean up uploaded files
function cleanupFiles(files) {
  setTimeout(() => {
    files.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) {
          console.error(`❌ Error deleting file ${file.path}:`, err);
        }
      });
    });

    // Try to remove batch directory
    if (files.length > 0) {
      const batchDir = path.dirname(files[0].path);
      fs.rmdir(batchDir, { recursive: true }, err => {
        if (err) {
          console.error(`❌ Error removing batch directory ${batchDir}:`, err);
        }
      });
    }
  }, 60000); // Clean up after 1 minute
}

// Get list of valid tables and their schemas
const getValidTables = async (req, res) => {
  try {
    const tableList = Array.from(tableMapper.validTables);

    res.status(200).json({
      status: 'success',
      tables: tableList,
      count: tableList.length,
      timestamp: '2025-04-07 02:17:31',
      user: 'wilmer2000',
    });
  } catch (error) {
    console.error('❌ Error getting table list:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting table list',
      error: error.message,
      timestamp: '2025-04-07 02:17:31',
      user: 'wilmer2000',
    });
  }
};

export default {
  importCsvFiles,
  getValidTables,
};