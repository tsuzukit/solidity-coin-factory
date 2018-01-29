const config = require('./config');
const Web3 = require('web3');
const web3 = new Web3();
const contractHelper = require('./contractHelper.js');
const compiledCrowdsale = require('./build/Crowdsale.json');

const addressOfTokenUsedAsReward = config.customTokenAddress;
const ifSuccessfulSendTo = config.crowdsale.ifSuccessfulSendTo;
const fundingGoalInEther = config.crowdsale.fundingGoalInEther;
const durationInMinutes = config.crowdsale.durationInMinutes;
const costOfEachTokenInEther = config.crowdsale.costOfEachTokenInEther;

const argumetns = [
  ifSuccessfulSendTo,
  contractHelper.toString(web3.utils.toWei(fundingGoalInEther)),
  durationInMinutes,
  contractHelper.toString(web3.utils.toWei(costOfEachTokenInEther)),
  addressOfTokenUsedAsReward
];
contractHelper.deploy(compiledCrowdsale, argumetns);

