const config = require('./config');
const Web3 = require('web3');

const provider = new Web3.providers.HttpProvider(config.endpoint);
const web3 = new Web3(provider);
const address = config.address;
const privateKey = config.privateKey;

const ContractHelper = {

  toMinimumUnit: (num) => {
    return num * 10 ** config.customToken.decimals;
  },

  toString: (i) => {
    var str='';
    do{
      let a = i%10;
      i=Math.trunc(i/10);
      str = a+str;
    }while(i>0)
    return str;
  },

  deploy: async (compiledContract, arguments, gas=2000000, gasPrice=2000000) => {
    const bytecode = compiledContract.bytecode;
    const abi = JSON.parse(compiledContract.interface);
    const contract = new web3.eth.Contract(abi);

    const gasString = parseInt(gas).toString(16);
    const gasPriceString = parseInt(gasPrice).toString(16);
    const data = contract.deploy({ data: '0x' + bytecode, arguments: arguments }).encodeABI();

    const transactionObject = {
      gas: gasString,
      gasPrice: gasPriceString,
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
  },

  send: async (encodedData, contractAddress, gas=2000000, gasPrice=2000000) => {
    const gasString = parseInt(gas).toString(16);
    const gasPriceString = parseInt(gasPrice).toString(16);
    const transactionObject = {
      gas: gasString,
      gasPrice: gasPriceString,
      data: encodedData,
      from: address,
      to: contractAddress
    };

    try {
      const signedTransaction = await web3.eth.accounts.signTransaction(transactionObject, privateKey);
      const result = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
      console.log(result);
    }
    catch (err) {
      console.log(err);
    }

  },

};

module.exports = ContractHelper;

