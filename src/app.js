'use strict';

const colors = require('colors');
const clear = require('clear');
const figlet = require('figlet');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
moment.locale('en');

// Clear the terminal screen if possible
clear();
// // Load the Standard font to use in the header
const fontFilename = path.resolve(__dirname+'/../assets/fonts/Standard.flf');
// Parse the font by file
figlet.parseFont('Standard', fs.readFileSync(fontFilename, 'utf8'));

// Print the Header
console.log(colors.blue(figlet.textSync('Data\nMocker', {font: 'Standard'})));
// console.log(colors.blue(figlet.textSync('Data\nMocker')));
console.log(colors.blue.bold.italic(`Random Data Generator\n`));
console.log(colors.gray(`Today is: ${moment().format('DD-MMM-YYYY')} at ${moment().format('hh:mm:SS a')}\n`));

// Prompt questions
const inquirer = require('inquirer');
inquirer.prompt([
    {
        type: 'input',
        name: 'sourceFilename',
        message: `What's the source filename?`,
        validate(value) {
            let filename = path.resolve('data')+'\\'+value;
            if ( /^[^<>:;,?"*|/]+$/.test(value) && fs.existsSync(filename) )
                return true;
            else return `The file ${filename} doesn't exist, please enter a valid filename`;
        },
    },
    {
        type: 'input',
        name: 'destinationFilename',
        message: `If the destination filename will change, what is it?`,
        default: null,
    },
    {
        type: 'list',
        name: 'format',
        message: 'Destination file format:',
        choices: [ 'json' ],
        default: 'json'
    },
])
.then((answers) => {
    try {
        // Generate the random data from the source to the destination file
        require('./utils/datamocker').generateFromFile(answers.sourceFilename, answers.destinationFilename);
    } catch (err) {
        const colors = require('colors');
        // Show the error/warning with colors
        switch(err.name) {
            case 'INFO':
                console.warn(` INFO `.bgCyan, `:`.cyan, colors.cyan(err.message));
                break;
            case 'WARNING':
                console.warn(` WARNING `.bgYellow, `:`.yellow, colors.yellow(err.message));
                break;
            default:
                if(process.env.NODE_ENV=='development') {
                    console.error(` 💢 😕 ❗`,` ERROR `.bgRed, `:`.red, colors.red(err));
                }
                else console.error(` 💢 😕 ❗`,` ERROR `.bgRed, `:`.red, colors.red(err.code,err.message));
                break;
        }
    }
})
.catch((err) => {
    if (err.isTtyError) {
        // Prompt couldn't be rendered in the current environment
        console.error(colors.red(err.isTtyError));
    } else {
        // Something else went wrong
        console.error(colors.red(err));
    }
});
