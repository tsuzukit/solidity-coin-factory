const path = require('path');
const fs = require('fs');
const solc = require('solc');

const inboxPath = path.resolve(__dirname, 'contracts', 'TOKEN_NAME.sol');
const source = fs.readFileSync(inboxPath, 'utf8');

var numberOfContracts = 1;
var nameOfContracts = ':TOKEN_NAME';

console.log('Compiling solidity source file');
module.exports = solc.compile(source, numberOfContracts).contracts[nameOfContracts];
console.log('Compile success');


