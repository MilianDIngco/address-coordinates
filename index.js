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

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (request, response) => {
    response.send( await readFile('./public/home.html', 'utf8') );
});

app.post('/upload', upload.single('spreadsheet'), function (req, res, next) {
    console.log("uploaded");
    console.log(req.file.path);
    // let workbook = xlsx.readFile(req.file.path);
    // let worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // const jsonData = xlsx.utils.sheet_to_json(worksheet);
    

    // for (let i = 0; i < jsonData.length; i++) {
    //     const line = jsonData[i];
    //     const address = `${line.Street} ${line.Town} ${line.State}`;

    //     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    //     axios.get(url)
    //         .then(response => {
    //             const { results } = response.data;
    //             if (results.length > 0) {
    //                 const location = results[0].geometry.location;
    //                 console.log(`Address: ${address} Latitude: ${location.lat}, Longitude: ${location.lng}`);
    //             } else {
    //                 console.log('No results found.');
    //             }
    //         })
    //         .catch(error => {
    //             console.error("Error fetching deta: ", error);
    //         });
    // }
    

})

app.listen(process.env.PORT || 3000, () => console.log("App available on http://localhost:3000"));