require('dotenv').config();
const axios = require('axios');
const { readFile } = require('fs').promises;
const express = require('express');
const xlsx = require("xlsx");
const fs = require("fs");
const multer = require("multer");
const { json } = require('body-parser');
const upload = multer({ dest: 'uploads/' });
const path = require('path');

const app = express();

const FILENAME = "updated";

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
    res.send( await readFile('./public/home.html', 'utf8') );
});

app.post('/upload', upload.single('spreadsheet'), async function (req, res, next) {
    console.log("uploaded");
    console.log(req.body);
    
    const { sheetName, ...headersObj } = req.body;

    let headers = Object.keys(headersObj);
    let values = Object.values(headersObj);

    let keyHeader = null;

    // Remove irrelevant columns
    for (let i = 0; i < headers.length; i++) {
        if (values[i] == -1) {
            headers.splice(i, 1);
            values.splice(i, 1);
            i--;
        }
        if (values[i] == -2) {
            keyHeader = headers[i];
            headers.splice(i, 1);
            values.splice(i, 1);
            i--;
        }
    }

    // Sort headers by values ( javascript magic or smth )
    headers = headers.map((_, i) => [headers[i], values[i]]) 
                    .sort((a, b) => a[1] - b[1])
                    .map(pair => pair[0]);

    /* Explanation
        1) map creates a new array where each element is paired to its corresponding value. 
        the value in data is not needed, thus => _
        we only use the index i
        Resulting in this
        [
            ["Street", 3],
            ["Town", 1],
            ["State", 2]
        ]
        
        2) sort sorts the array based on the second element, and takes a comparison function. 
        a[1] - b[1] sees if a is bigger (if result is +), then it knows that a should come after b
     */

    let workbook = xlsx.readFile(req.file.path);
    let worksheet = workbook.Sheets[sheetName];
    let addressJSON = xlsx.utils.sheet_to_json(worksheet);

    // Add latitude column
    addressJSON = addressJSON.map((row, index) => ({
        ...row,
        LATITUDE: 0,
        LONGITUDE: 0
    }));

    let coordinatePromises = [];
    for (let i = 0; i < addressJSON.length; i++) {
        let line = addressJSON[i];

        // Concat address in order
        let address = '';
        for (let n = 0; n < headers.length; n++) {
            let value = line[headers[n]];
            address += value + " ";
        }
        address.trimEnd();

        // Make call to api to get coordinates
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        coordinatePromises.push(axios.get(url)
            .then(response => {
                const { results } = response.data;
                if (results.length > 0) {
                    const location = results[0].geometry.location;
                    console.log(`${i}: Address: ${address} Latitude: ${location.lat}, Longitude: ${location.lng}`);
                    addressJSON[i]["LATITUDE"] = location.lat;
                    addressJSON[i]["LONGITUDE"] = location.lng;
                } else {
                    console.log('No results found.');
                }
            }));
    }

    await Promise.all(coordinatePromises).then(() => {
        const newSheet = xlsx.utils.json_to_sheet(addressJSON);
        workbook.Sheets[sheetName] = newSheet;
        xlsx.writeFile(workbook, `${FILENAME}.xlsx`);

        // Delete file
        fs.unlink(req.file.path, (error) => {
            if (error) {
                console.error("ERROR: Failed to delete temporary file from " + req.file.path);
            }
            console.log("Deleted file successfully from " + req.file.path);
        });

        const filePath = path.join(__dirname, `${FILENAME}.xlsx`);
        res.download(filePath, (error) => {
            if(error) {
                console.error("ERROR: Downloading failed");
                res.status(500).send("Error downloading file");
            }
        });
    });
});

app.listen(process.env.PORT || 3000, () => console.log("App available on http://localhost:3000"));