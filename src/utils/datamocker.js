'use strict';

const colors = require('colors');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
// moment.locale('es');

module.exports = {

    // Read a file that contains a valid schema to generate random data and save them in a JSON file
    generateFromFile: (sourceFilename, destinationFilename) => {
  
        // Set the path of the files with the data to process and export them
        const DATA_PATH = path.resolve('data')+'\\';
        
        // Validate if the data-path folder exists
        if ( !fs.existsSync(DATA_PATH) || !fs.readdirSync(DATA_PATH) ) {
            // If the data-path folder doesn't exist then create it
            fs.mkdirSync(DATA_PATH);
            // Validate again if the folder exists
            if ( !fs.readdirSync(DATA_PATH) ) {
                let err = Error(`The ${DATA_PATH} couldn't be created as folder may be due to not having the necessary permissions.`);
                err.name = 'WARNING';
                throw err;  
            }
        }
    
        // Validate the argument variable with the filename
        if ( !sourceFilename ) {
            let err = Error(`The filename cannot be empty (missing argv).`);
            err.name = 'WARNING';
            throw err;
        }
    
        // Set the JSON file from the argument variable
        const SOURCE_JSON_FILE = DATA_PATH + sourceFilename;
    
        // Validate if the JSON file exists
        if ( !fs.existsSync(SOURCE_JSON_FILE) ) {
            let err = Error(`The file "${SOURCE_JSON_FILE}" doesn't exist.`);
            err.name = 'WARNING';
            throw err;
        }
    
        // Validate the extension file
        if ( !path.extname(SOURCE_JSON_FILE)=='.json' ) {
            let err = Error(`The file "${SOURCE_JSON_FILE}" must have the extension JSON (should be end with .json).`);
            err.name = 'WARNING';
            throw err;
        }
        
        // Read the File-data
        const fileData = fs.readFileSync(SOURCE_JSON_FILE, {encoding:'utf8', flag:'r'});
        if ( fileData.length == 0 ) {
            let err = Error(`The file "${SOURCE_JSON_FILE}" is empty.`);
            err.name = 'WARNING';
            throw err;
        }
    
        // Parse the File-data to JSON
        var parsedData;
        try {
            parsedData = JSON.parse(fileData);
        } catch (ex) {
            let err;
            if (ex.name=='SyntaxError') {
                err = Error(`The file "${SOURCE_JSON_FILE}" doesn't contain a valid JSON object.`);
                err.name = 'WARNING';
            }
            throw err;
        }
        
        // Set JSON from the parsed data
        const jsonData = parsedData;
        // Validate if the JSON-data is empty
        if ( !jsonData || Object.entries(jsonData).length===0 ) {
            let err = Error(`The file "${SOURCE_JSON_FILE}" contains an empty JSON object.`);
            err.name = 'WARNING';
            throw err;
        }
        console.group(`✔`.green, colors.cyan(`File read:`));
        console.info(`${SOURCE_JSON_FILE}`.blue);
        console.info(`${moment.utc().local().format('ddd DD-MMM-YYYY HH:mm:ss.SSS')}`.gray);
        console.groupEnd();
    
        // Set the destination file to export
        const DESTINATION_FILE = destinationFilename
            ? DATA_PATH+`${path.basename(destinationFilename).replace(path.extname(destinationFilename),'')}.data${path.extname(destinationFilename)||'.json'}`
            : DATA_PATH+`${path.basename(SOURCE_JSON_FILE).replace('.json','')}.data${path.extname(SOURCE_JSON_FILE)||'.json'}`
        // const DESTINATION_FILE_EXT = path.extname(DESTINATION_FILE) || '.json';
    
        // Headers of the file to export
        var headers = [];
    
        // Separate the looptree elements of the rest of the fields from the JSON-data file
        var loopTree = [], restFields = [];
        for (const key in jsonData) {
            // Add to the Headers
            headers.push(key);
            const element = jsonData[key];
            // If the Element has a loop tree position
            if (element.looptree>0) {
                loopTree[key] = element;
            }
            else {
                restFields[key] = element;
            }
        }
    
        // LoopTree Elements of the JSON-data
        var loopTreeElements = {};
    
        // Process each loop according the LoopTree elements
        for (const loopKey in loopTree) {
            const loopElement = loopTree[loopKey];
            var loopElements = [];
            // Process the loop element according its type
            switch (loopElement.type) {
                // Element type: DATE
                case 'date':
                    // Date pattern: YYYY-MM-DD (only)
                    const datePattern = /^[0-9]{4}-(((0[13578]|(10|12))-(0[1-9]|[1-2][0-9]|3[0-1]))|(02-(0[1-9]|[1-2][0-9]))|((0[469]|11)-(0[1-9]|[1-2][0-9]|30)))$/;
                    // Validate the dates values
                    if ( loopElement.start && loopElement.end 
                        && datePattern.test(loopElement.start) && datePattern.test(loopElement.end)
                    ) {
                        for (let date = loopElement.start;
                            moment(date).isSameOrBefore(loopElement.end);
                            date=moment(date).add(1,'d').format('YYYY-MM-DD')
                        ){
                            loopElements.push(date);                       
                        }
                    }
                    else {
                        let err = Error(`'${loopKey}' has invalid ${loopElement.type} values.`);
                        err.name = 'WARNING';
                        throw err;
                    }
                    break;
                // Element type: INTEGER / DECIMAL
                case 'integer': case 'decimal': case 'float': case 'double':
                    // Set the Number pattern either integer or double or decimal/float
                    let numberPattern;
                    if(loopElement.type=='integer') numberPattern = /^[+-]?\d+$/;
                    else numberPattern = /^[+-]?(\d*\.)?\d+$/;
                    // Validate the number values
                    if (
                        (
                            (loopElement.max||loopElement.max===0) && numberPattern.test(loopElement.max)
                            && (loopElement.min||loopElement.min===0) && numberPattern.test(loopElement.min)
                        )
                        || (loopElement.value)
                    ) {                    
                        if (loopElement.random) {
                            if(loopElement.type=='integer') loopElements.push( Math.floor(Math.random() * (Math.floor(loopElement.max) - Math.ceil(loopElement.min) + 1)) + Math.ceil(loopElement.min) );
                            else loopElements.push( parseFloat( (Math.random() * (loopElement.max - loopElement.min) + loopElement.min).toFixed(loopElement.decimals||2)) );
                        }
                        else {
                            for (let number = loopElement.min; number <= loopElement.max; number+=(loopElement.incrementable||1)) {
                                loopElements.push(number);
                            }
                        }
                    }
                    else {
                        let err = Error(`'${loopKey}' has invalid ${loopElement.type} values.`);
                        err.name = 'WARNING';
                        throw err;
                    }
                    break;
                // Element type: STRING
                case 'string':
                    if ( (loopElement.isIn && Array.isArray(loopElement.isIn)) || loopElement.value || loopElement.nullable) {
                        if(loopElement.value) {
                            loopElements.push(loopElement.value);
                        }
                        else {
                            loopElement.isIn.forEach(element => {
                                loopElements.push(element);
                            });
                        }
                    }
                    else {
                        let err = Error(`'${loopKey}' has invalid ${loopElement.type} values.`);
                        err.name = 'WARNING';
                        throw err;
                    }
                    break;
                default:
                    break;
            }
            loopTreeElements[loopKey] = loopElements;
            console.groupEnd();
        }

        var jsonMockData = [];

        const firstLoopKey = Object.keys(loopTreeElements)[0];
        const firstLoopElements = loopTreeElements[ firstLoopKey ];

        const secondLoopKey = Object.keys(loopTreeElements)[1];
        const secondLoopElements = loopTreeElements[ secondLoopKey ];
        
        const thirdLoopKey = Object.keys(loopTreeElements)[2];
        const thirdLoopElements = loopTreeElements[ thirdLoopKey ];

        // Process each loop elements
        firstLoopElements.forEach(element1 => {
            secondLoopElements.forEach(element2 => {
                thirdLoopElements.forEach(element3 => {

                    // Add the values with their keys to the JSON element
                    let jsonElement = {};
                    jsonElement[firstLoopKey] = element1;
                    jsonElement[secondLoopKey] = element2;
                    jsonElement[thirdLoopKey] = element3;

                    // Process the rest of the fields (no loop elements)
                    for (const fieldKey in restFields) {
                        const field = restFields[fieldKey];
                        switch (field.type) {
                            // Element type: DATE
                            case 'date':
                                // Add the value to the JSON element
                                jsonElement[fieldKey] = moment().format('YYYY-MM-DD');
                                break;
                            // Element type: DATETIME
                            case 'datetime':
                                // Add the value to the JSON element
                                jsonElement[fieldKey] = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
                                break;
                            // Element type: INTEGER / DECIMAL
                            case 'integer': case 'decimal': case 'float': case 'double':
                                // Set the Number pattern either integer or double or decimal/float
                                let numberPattern;
                                if(field.type=='integer') numberPattern = /^[+-]?\d+$/;
                                else numberPattern = /^[+-]?(\d*\.)?\d+$/;
                                // Validate the number values
                                if(
                                    (
                                        (field.max||field.max===0) && numberPattern.test(field.max)
                                        && (field.min||field.min===0) && numberPattern.test(field.min)
                                    )
                                    || (field.value)
                                ) {
                                    let value;
                                    if(field.random) {
                                        if(field.type=='integer') value = Math.floor(Math.random() * (Math.floor(field.max) - Math.ceil(field.min) + 1)) + Math.ceil(field.min);
                                        else value = parseFloat( (Math.random() * (field.max - field.min) + field.min).toFixed(field.decimals||2));
                                    }
                                    // Add the value to the JSON element
                                    jsonElement[fieldKey] = value;
                                }
                                else {
                                    let err = Error(`'${fieldKey}' has invalid ${field.type} values.`);
                                    err.name = 'WARNING';
                                    throw err;
                                }
                                break;
                            default: break;
                        }
                    }         
                    // Add the JSON element to the JSON Mock-data
                    jsonMockData.push(jsonElement);
                });
            });
            console.groupEnd();
        });
        
        // Set the format of the mock-data to export in a file    
        const mockData = JSON.stringify(jsonMockData,null,2);
        
        // Write the file to export containing the final mock-data
        fs.writeFileSync(DESTINATION_FILE, mockData);
        
        console.group(`✔`.green, colors.cyan(`File exported:`));
        console.info(`${DESTINATION_FILE}`.blue);
        console.info(`${moment.utc().local().format('ddd DD-MMM-YYYY HH:mm:ss.SSS')}`.gray);
        console.groupEnd();

        // Return the mock-data in JSON format
        return jsonMockData;
    
    },

}
