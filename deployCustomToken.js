const config = require('./config');
const compiledCustomToken = require('./build/CustomToken.json');
const contractHelper = require('./contractHelper.js');

const initialSupply = config.customToken.initialSupply;
const tokenName = config.customToken.tokenName;
const tokenSymbol = config.customToken.tokenSymbol;
const tokenDecimals = config.customToken.decimals;

const arguments = [
  contractHelper.toString(contractHelper.toMinimumUnit(initialSupply)),
  tokenName,
  tokenSymbol,
  contractHelper.toString(tokenDecimals)
];
contractHelper.deploy(compiledCustomToken, arguments);

