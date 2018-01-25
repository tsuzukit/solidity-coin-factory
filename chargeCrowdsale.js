const config = require('./config');
const Web3 = require('web3');
const compiledCustomToken = require('./build/Crowdsale.json');

const address = config.address;
const privateKey = config.privateKey;

const provider = new Web3.providers.HttpProvider(config.endpoint);
const web3 = new Web3(provider);
const abi = JSON.parse(compiledCustomToken.interface);
const contract = new web3.eth.Contract(abi);

const fundingGoalInWei = config.crowdsale.fundingGoalInWei;
const costOfEachTokenInWei = config.crowdsale.costOfEachTokenInWei;
const amountOfTokenTransferPreSale = (fundingGoalInWei / costOfEachTokenInWei).toString();

console.log(amountOfTokenTransferPreSale);

// const deploy = async () => {
//   const data = contract.deploy({
//     data: '0x' + compiledCustomToken.bytecode,
//     arguments: [
//       ifSuccessfulSendTo,
//       fundingGoalInEthers,
//       durationInMinutes,
//       etherCostOfEachToken,
//       addressOfTokenUsedAsReward
//     ],
//   }).encodeABI();
//
//   const gas = parseInt(2000000).toString(16);
//   const gasPrice = parseInt(2000000).toString(16);
//   const transactionObject = {
//     gas: gas,
//     gasPrice: gasPrice,
//     data: data,
//     from: address,
//   };
//
//   try {
//     const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, privateKey);
//     const result = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
//     console.log(result);
//   }
//   catch (err) {
//     console.log(err);
//   }
// };
// deploy();

