const config = require('./config');
const Web3 = require('web3');
const compiledCrowdsale = require('./build/Crowdsale.json');

const address = config.address;
const privateKey = config.privateKey;

const ifSuccessfulSendTo = config.crowdsale.ifSuccessfulSendTo;
const fundingGoalInWei = config.crowdsale.fundingGoalInWei;
const durationInMinutes = config.crowdsale.durationInMinutes;
const costOfEachTokenInWei = config.crowdsale.costOfEachTokenInWei;
const addressOfTokenUsedAsReward = config.crowdsale.addressOfTokenUsedAsReward;

const provider = new Web3.providers.HttpProvider(config.endpoint);
const web3 = new Web3(provider);
const abi = JSON.parse(compiledCrowdsale.interface);
const contract = new web3.eth.Contract(abi);

const deploy = async () => {
  const data = contract.deploy({
    data: '0x' + compiledCrowdsale.bytecode,
    arguments: [
      ifSuccessfulSendTo,
      fundingGoalInWei,
      durationInMinutes,
      costOfEachTokenInWei,
      addressOfTokenUsedAsReward
    ],
  }).encodeABI();

  const gas = parseInt(2000000).toString(16);
  const gasPrice = parseInt(2000000).toString(16);
  const transactionObject = {
    gas: gas,
    gasPrice: gasPrice,
    data: data,
    from: address,
  };

  try {
    const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, privateKey);
    const result = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log(result);
  }
  catch (err) {
    console.log(err);
  }
};
deploy();
