const fs = require('fs');
const csvParser = require('csv-parser');
const {Transform} = require('stream');

const path = require('path');
const {pool} = require("../config/database");
const {NAME_FILES_DATA_ALLOWED} = require("../constants/constant");

// Helper function to handle errors
const handleError = (req, res, err) => {
    console.error('Error processing CSV:', err);
    res.status(500).json({message: 'Error processing CSV file', error: err.message});
}
// Helper function to sanitize identifiers
const sanitizeIdentifier = (identifier) => {
    // Remove special characters and spaces, convert to lowercase
    return identifier
        .trim()
        .replace(/^(\d{8}_\d+_MiFitness_)/, '');
};
// Helper function to camelToSnake
const camelToSnake = (str) => {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};

// Helper function to check if table exists
const tableExists = async (tableName) => {
    const q = 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = $1::text);';
    const result = await pool.query(q, [tableName]);
    return result.rows[0].name;
};
// Helper function to determine SQL type from value
const getSqlType = (value) => {
    if (value === null || value === '') return 'TEXT';

    // Check if it's a number
    if (!isNaN(value) && value.toString().trim() !== '') {
        if (value.indexOf('.') !== -1) return 'NUMERIC';
        return 'INTEGER';
    }

    // Check if it's a date
    const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
    if (datePattern.test(value)) return 'TIMESTAMP';

    // Default to TEXT
    return 'TEXT';
};

// Process CSV and return data
exports.processCsv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No CSV file uploaded'
            });
        }

        // Extract table name from filename (remove extension and sanitize)
        const originalFilename = path.parse(req.file.originalname).name;
        const tableName = sanitizeIdentifier(originalFilename);


        const fileNameIsValid = NAME_FILES_DATA_ALLOWED.includes(tableName);
        if (!fileNameIsValid) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del CSV no es correcto'
            });
        }

        const filePath = req.file.path;

        // Read the CSV headers first to determine columns
        let headers = [];
        let firstRow = null;
        let rowCount = 0;

        // First pass to get headers and sample data
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('headers', (headerList) => {
                    headers = headerList.map((h) => camelToSnake(sanitizeIdentifier(h)));
                })
                .on('data', (data) => {
                    if (!firstRow) {
                        firstRow = data;
                    }
                    rowCount++;
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (headers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'CSV file has no headers'
            });
        }

        // Determine table existence and handle accordingly
        const exists = await tableExists(tableName);

        if (!exists) {
            // Create new table based on headers and first row
            const columnDefinitions = headers.map(header => {
                const sampleValue = firstRow[header.replace(/_/g, ' ')];
                const sqlType = getSqlType(sampleValue);
                return `"${header}" ${sqlType}`;
            }).join(', ');

            const createTableQuery = `
                CREATE TABLE "${tableName}"
                (
                    id         SERIAL PRIMARY KEY,
                    ${columnDefinitions},
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            await pool.query(createTableQuery);
            console.log(`Created new table: ${tableName}`);
        }

        // Second pass to insert the data
        const data = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    data.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Batch insert data
        if (data.length > 0) {
            // Get sanitized column names
            const columnNames = headers.map(h => `"${h}"`).join(', ');

            // Prepare values for bulk insert
            const values = data.map(row => {
                return headers.map(header => {
                    // Get the original header name from the CSV
                    const originalHeader = headers.find(h => camelToSnake(sanitizeIdentifier(h)) === header) || header;
                    // Handle different formats of the header name in the data object
                    return row[originalHeader] || row[originalHeader.replace(/_/g, ' ')] || '';
                });
            });

            // Bulk insert with a single query
            const placeholders = values.map((_, rowIndex) =>
                `(${headers.map((_, colIndex) => `$${rowIndex * headers.length + colIndex + 1}`).join(', ')})`
            ).join(', ');

            const flatValues = values.flat();

            const insertQuery = `
                INSERT INTO "${tableName}" (${columnNames})
                VALUES ${placeholders}
            `;

            await pool.query(insertQuery, flatValues);
            console.log(`Inserted ${values.length} rows into ${tableName}`);
        }

        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: `Successfully processed CSV file into table '${tableName}'`,
            table: tableName,
            rowCount: data.length,
            tableCreated: !exists
        });

    } catch (error) {
        console.error('Error importing CSV:', error);
        res.status(500).json({message: 'Error processing CSV file', error: error.message});
    }
};

// Import CSV data into database
exports.importCsv = async (req, res) => {
    const results = [];
    let errorCount = 0;

    const validateData = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            // Example validation - ensure required fields exist
            // if (!chunk.name || !chunk.email) {
            //     errorCount++;
            //     return callback();
            // }
            //
            // // Clean and transform data if needed
            // const cleanedData = {
            //     name: chunk.name.trim(),
            //     email: chunk.email.toLowerCase().trim(),
            //     // Add other fields as needed
            // };

            // results.push(cleanedData);
            results.push(chunk);
            callback();
        }
    });

    const readable = fs.createReadStream(req.file.path, {encoding: 'utf8'})
        .pipe(csvParser())
        .pipe(validateData)
        .on('end', () => {
            // In a real app, you would save results to database here
            console.log(`CSV file successfully processed`);
            res.status(200).json({
                message: 'CSV file successfully imported',
                totalRows: results.length + errorCount,
                successfulRows: results.length,
                errorRows: errorCount,
                timestamp: new Date().toISOString()
            });
        })
        .on('error', (err) => handleError(req, res, err));

    try {
        await readable.pipe(res);
    } catch (error) {
        console.error('Error importing CSV:', error);
        res.status(500).json({message: 'Error importing CSV file', error: error.message});
    }
};
