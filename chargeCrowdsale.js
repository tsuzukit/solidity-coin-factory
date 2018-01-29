const config = require('./config');
const Web3 = require('web3');
const compiledCustomToken = require('./build/CustomToken.json');
const contractHelper = require('./contractHelper.js');

const crowdsaleAddress = config.crowdsaleAddress;
const customTokenAddress = config.customTokenAddress;
const fundingGoalInEther = config.crowdsale.fundingGoalInEther;
const costOfEachTokenInEther = config.crowdsale.costOfEachTokenInEther;
const amountOfTokenTransferPreSale = config.crowdsale.amountOfTokenTransferPreSale;

contractHelper.send(compiledCustomToken, customTokenAddress, crowdsaleAddress, amountOfTokenTransferPreSale);

