const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('Web3');
const provider = ganache.provider();
const web3 = new Web3(provider);

const compiledCustomToken = require('../build/CustomToken.json');
const compiledCrowdsale = require('../build/Crowdsale.json');

const initialSupply = web3.utils.toWei("50", "ether");
const tokenName = "SaunaToken";
const tokenSymbol = "SAU";
const fundingGoalInWei = web3.utils.toWei("10", "ether");
const durationInMinutes = 1;
const costOfEachTokenInWei = web3.utils.toWei("0.000001", "ether");
const amountOfTokenTransferPreSale = (fundingGoalInWei / costOfEachTokenInWei).toString();
let accounts;
let customToken;
let crowdsale;
let initialBalance;

beforeEach( async () => {
  accounts = await web3.eth.getAccounts();
  initialBalance = await web3.eth.getBalance(accounts[0]);

  customToken = await new web3.eth.Contract(JSON.parse(compiledCustomToken.interface))
    .deploy({
      data: compiledCustomToken.bytecode,
      arguments: [initialSupply, tokenName, tokenSymbol]
    })
    .send({
      from: accounts[0], gas: '2000000'
    });
  customToken.setProvider(provider);

  const ifSuccessfulSendTo = accounts[0];
  const addressOfTokenUsedAsReward = customToken.options.address;
  crowdsale = await new web3.eth.Contract(JSON.parse(compiledCrowdsale.interface))
    .deploy({
      data: compiledCrowdsale.bytecode,
      arguments: [ifSuccessfulSendTo, fundingGoalInWei, durationInMinutes, costOfEachTokenInWei, addressOfTokenUsedAsReward]
    })
    .send({
      from: accounts[0], gas: '2000000'
    });
  crowdsale.setProvider(provider);

  // charge token pre sale
  const result = await customToken.methods.transfer(crowdsale.options.address, amountOfTokenTransferPreSale).send({
    from: accounts[0]
  });
});

describe('crowdsale', () => {
  it('deploys custom token and crowd sale', () => {
    assert.ok(customToken.options.address);
    assert.ok(crowdsale.options.address);
  });

  it('manager can charge token to crowdsale contract', async () => {
    const tokenBalanceAtManager = await customToken.methods.balanceOf(accounts[0]).call();
    assert.equal(initialSupply - amountOfTokenTransferPreSale, tokenBalanceAtManager);
    const tokenBalanceAtCrowdsale = await customToken.methods.balanceOf(crowdsale.options.address).call();
    assert.equal(amountOfTokenTransferPreSale, tokenBalanceAtCrowdsale);
  });

  it('investor can purchase token from crowdsale', async () => {
    const tokenBalanceAtCrowdsale = await customToken.methods.balanceOf(crowdsale.options.address).call();
    const investmentInEther = 1;
    await web3.eth.sendTransaction({
      to: crowdsale.options.address,
      from: accounts[1],
      value: investmentInEther,
      gas: '1000000'
    });

    const investorBalance = await customToken.methods.balanceOf(accounts[1]).call();
    assert.equal(web3.utils.toWei(investmentInEther.toString(), "ether") / costOfEachTokenInWei, investorBalance);

    const tokenBalanceAtCrowdsaleAfterPurchase = await customToken.methods.balanceOf(crowdsale.options.address).call();
    assert.equal(tokenBalanceAtCrowdsale, (parseInt(tokenBalanceAtCrowdsaleAfterPurchase) + parseInt(investorBalance)).toString());
  });

});
