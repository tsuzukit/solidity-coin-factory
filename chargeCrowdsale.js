const config = require('./config');
const Web3 = require('web3');
const compiledCustomToken = require('./build/CustomToken.json');
const contractHelper = require('./contractHelper.js');

const crowdsaleAddress = config.crowdsaleAddress;
const customTokenAddress = config.customTokenAddress;
const fundingGoalInEther = config.crowdsale.fundingGoalInEther;
const costOfEachTokenInEther = config.crowdsale.costOfEachTokenInEther;
const amountOfTokenTransferPreSale = contractHelper.toMinimumUnit(fundingGoalInEther / costOfEachTokenInEther).toString();

const web3 = new Web3();
const abi = JSON.parse(compiledCustomToken.interface);
const contract = new web3.eth.Contract(abi, customTokenAddress);
const data = contract.methods.transfer(crowdsaleAddress, amountOfTokenTransferPreSale);

contractHelper.send(data, customTokenAddress);

