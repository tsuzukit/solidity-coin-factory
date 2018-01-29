const config = require('./config');
const Web3 = require('web3');
const compiledCustomToken = require('./build/CustomToken.json');

const address = config.address;
const privateKey = config.privateKey;

const provider = new Web3.providers.HttpProvider(config.endpoint);
const web3 = new Web3(provider);
const abi = JSON.parse(compiledCustomToken.interface);

const crowdsaleAddress = config.charge.address;
const addressOfTokenUsedAsReward = config.crowdsale.addressOfTokenUsedAsReward;
const fundingGoalInWei = config.crowdsale.fundingGoalInWei;
const costOfEachTokenInWei = config.crowdsale.costOfEachTokenInWei;
const amountOfTokenTransferPreSale = (fundingGoalInWei / costOfEachTokenInWei).toString();

const contract = new web3.eth.Contract(abi, addressOfTokenUsedAsReward);

const send = async () => {
  const data = contract.methods.transfer(crowdsaleAddress, amountOfTokenTransferPreSale).encodeABI();

  const gas = parseInt(2000000).toString(16);
  const gasPrice = parseInt(2000000).toString(16);
  const transactionObject = {
    gas: gas,
    gasPrice: gasPrice,
    data: data,
    from: address,
    to: addressOfTokenUsedAsReward
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
send();

