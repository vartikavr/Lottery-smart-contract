const path = require('path');
const fs = require('fs');
// above both modules are standard i.e. don't need to npm i them

const solc = require('solc'); //solidity compiler@0.4.17

//we don't directly require inbox.sol file because then this compile file would consider it as a js file and try to run it

const lotteryPath = path.resolve(__dirname, 'contracts', 'lottery.sol');
const source = fs.readFileSync(lotteryPath, 'utf8'); // used to read the content of the file and we also specify the encoding used, here utf8

module.exports = solc.compile(source, 1).contracts[':Lottery']; //pass source code and number of contracts we want to compile
