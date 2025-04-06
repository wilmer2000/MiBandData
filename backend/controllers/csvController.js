const fs = require('fs');
const csvParser = require('csv-parser');
const {Transform} = require('stream');

const handleError = (req, res, err) => {
    console.error('Error processing CSV:', err);
    res.status(500).json({message: 'Error processing CSV file', error: err.message});
}

// Process CSV and return data
exports.processCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({message: 'No file uploaded or file is not a CSV'});
    }

    const results = [];

    const readable = fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Log upload information
            console.log(`CSV processing completed at 2025-04-06 00:21:44 by wilmer2000`);
            console.log(`Processed ${results.length} rows from ${req.file.originalname}`);

            res.status(200).json({
                message: 'CSV file successfully processed',
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                rowCount: results.length,
                data: results.slice(0, 10), // Return only first 10 rows as preview
                timestamp: new Date().toISOString()
            });

            // Optionally remove the file after processing
            if (req.body.deleteAfterProcess === 'true') {
                fs.unlink(req.file.path, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    } else {
                        console.log(`Deleted temporary file: ${req.file.path}`);
                    }
                });
            }
        })
        .on('error', (err) => handleError(req, res, err));
    try {
        await readable.pipe(res);
    } catch (error) {
        console.error('Error importing CSV:', error);
        res.status(500).json({message: 'Error importing CSV file', error: error.message});
    }
};

// Import CSV data into database
exports.importCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({message: 'No file uploaded or file is not a CSV'});
    }

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