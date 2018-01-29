const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('Web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const config = require('../config.json');
const contractHelper = require('../contractHelper.js');

const compiledCustomToken = require('../build/CustomToken.json');
const compiledCrowdsale = require('../build/Crowdsale.json');

const initialSupply = config.customToken.initialSupply;
console.log("initial Supply is " + initialSupply);

const tokenName = config.customToken.tokenName;
const tokenSymbol = config.customToken.tokenSymbol;
const tokenDecimals = config.customToken.decimals;

const durationInMinutes = config.crowdsale.durationInMinutes;
const fundingGoalInEther = config.crowdsale.fundingGoalInEther;
const costOfEachTokenInEther = config.crowdsale.costOfEachTokenInEther;
const fundingGoalInWei = web3.utils.toWei(fundingGoalInEther);
const costOfEachTokenInWei = web3.utils.toWei(costOfEachTokenInEther);
const amountOfTokenTransferPreSale = config.crowdsale.amountOfTokenTransferPreSale;

let accounts;
let customToken;
let crowdsale;
let initialBalance;

const increaseTime = function(duration) {
  const id = Date.now();
  web3.currentProvider.sendAsync({
    jsonrpc: '2.0',
    method: 'evm_increaseTime',
    params: [duration],
    id: id,
  }, err1 => {
    if (!err1) {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: new Date().getSeconds()
      });
    }
  })
};


beforeEach( async () => {
  accounts = await web3.eth.getAccounts();
  initialBalance = await web3.eth.getBalance(accounts[0]);

  customToken = await new web3.eth.Contract(JSON.parse(compiledCustomToken.interface))
    .deploy({
      data: compiledCustomToken.bytecode,
      arguments: [initialSupply, tokenName, tokenSymbol, tokenDecimals]
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
      arguments: [
        ifSuccessfulSendTo,
        fundingGoalInWei,
        durationInMinutes,
        costOfEachTokenInWei,
        addressOfTokenUsedAsReward,
        tokenDecimals
      ]
    })
    .send({
      from: accounts[0], gas: '2000000'
    });
  crowdsale.setProvider(provider);

  // charge token pre sale
  try {
    const result = await customToken.methods.transfer(crowdsale.options.address, amountOfTokenTransferPreSale).send({
      from: accounts[0]
    });
  } catch (err) {
    console.log(err);
  }
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

  it('manager can send token back from crowdsale contract', async () => {
    const tokenBalanceAtManager = await customToken.methods.balanceOf(accounts[0]).call();
    assert.equal(initialSupply - amountOfTokenTransferPreSale, tokenBalanceAtManager);
    const tokenBalanceAtCrowdsale = await customToken.methods.balanceOf(crowdsale.options.address).call();
    assert.equal(amountOfTokenTransferPreSale, tokenBalanceAtCrowdsale);

    await crowdsale.methods.transferTokenBackToOwner(amountOfTokenTransferPreSale).send({
      from: accounts[0],
      gas: '1000000'
    });
    const tokenBalanceAtCrowdsaleAfterRefund = await customToken.methods.balanceOf(crowdsale.options.address).call();
    assert.equal(tokenBalanceAtCrowdsale - amountOfTokenTransferPreSale, tokenBalanceAtCrowdsaleAfterRefund);
    const tokenBalanceAtManagerAfterRefund = await customToken.methods.balanceOf(accounts[0]).call();
    assert.equal(initialSupply, tokenBalanceAtManagerAfterRefund);
  });

  it('only manager can send token back', async () => {
    try {
      await crowdsale.methods.transferTokenBackToOwner(amountOfTokenTransferPreSale).send({
        from: accounts[1],
        gas: '1000000'
      });
      assert(false);
    }
    catch (err) {
      assert(true);
    }
  });

  it('investor can purchase token from crowdsale', async () => {
    const tokenBalanceAtCrowdsale = await customToken.methods.balanceOf(crowdsale.options.address).call();
    const investmentInWei = web3.utils.toWei((config.crowdsale.fundingGoalInEther * 0.1).toString(), "ether");
    await web3.eth.sendTransaction({
      to: crowdsale.options.address,
      from: accounts[1],
      value: investmentInWei,
      gas: '1000000'
    });

    const investorBalance = await customToken.methods.balanceOf(accounts[1]).call();
    assert.equal(investmentInWei * 10 ** tokenDecimals / costOfEachTokenInWei, investorBalance);

    const tokenBalanceAtCrowdsaleAfterPurchase = await customToken.methods.balanceOf(crowdsale.options.address).call();
    assert.equal(tokenBalanceAtCrowdsale, (parseInt(tokenBalanceAtCrowdsaleAfterPurchase) + parseInt(investorBalance)));
  });

  it('Clowdsale closed after deadline', async () => {
    let isClowdsaleClosed = await crowdsale.methods.crowdsaleClosed().call();
    assert(!isClowdsaleClosed);
    await increaseTime(10000);
    try {
      const investmentInWei = web3.utils.toWei((config.crowdsale.fundingGoalInEther * 0.1).toString(), "ether");
      await web3.eth.sendTransaction({
        to: crowdsale.options.address,
        from: accounts[1],
        value: investmentInWei,
        gas: '1000000'
      });
    }
    catch (err) {
    }
    isClowdsaleClosed = await crowdsale.methods.crowdsaleClosed().call();
    assert(isClowdsaleClosed);
  });

  it('Clowdsale closed after enough fund is raised', async () => {
    let isClowdsaleClosed = await crowdsale.methods.crowdsaleClosed().call();
    assert(!isClowdsaleClosed);
    let fundingGoalReached = await crowdsale.methods.fundingGoalReached().call();
    assert(!fundingGoalReached);

    const investmentInWei = web3.utils.toWei(config.crowdsale.fundingGoalInEther, "ether"); // this is funding goal
    try {
      await web3.eth.sendTransaction({
        to: crowdsale.options.address,
        from: accounts[1],
        value: investmentInWei,
        gas: '1000000'
      });
    }
    catch (err) {
      console.log(err);
    }
    isClowdsaleClosed = await crowdsale.methods.crowdsaleClosed().call();
    assert(isClowdsaleClosed);
    fundingGoalReached = await crowdsale.methods.fundingGoalReached().call();
    assert(fundingGoalReached);

    // check crowdsale actually has ether of funding goal amount
    let amount = await web3.eth.getBalance(crowdsale.options.address);
    assert.equal(config.crowdsale.fundingGoalInEther, web3.utils.fromWei(amount));

    // check amount raised is same as the wei sent
    let amountRaised = await crowdsale.methods.amountRaised().call();
    assert.equal(investmentInWei, amountRaised);
  });

  it('cannot withdraw ether before ending crowdsale', async () => {
    try {
      await crowdsale.methods.safeWithdrawal().send({
        from: accounts[0],
        gas: '1000000'
      });
      assert(false);
    }
    catch (err) {
      assert(true);
    }
  });

  it('can withdraw ether after ending crowdsale', async () => {
    await increaseTime(10000);
    try {
      await crowdsale.methods.safeWithdrawal().send({
        from: accounts[0],
        gas: '1000000'
      });
      assert(true);
    }
    catch (err) {
      assert(false);
    }
  });

  it('can withdraw ether when funding goal is reached', async () => {
    let amount = await web3.eth.getBalance(crowdsale.options.address);
    assert.equal(0, amount);

    const investmentInWei = web3.utils.toWei(config.crowdsale.fundingGoalInEther, "ether");
    await web3.eth.sendTransaction({
      to: crowdsale.options.address,
      from: accounts[2],
      value: investmentInWei,
      gas: '1000000'
    });
    let fundingGoalReached = await crowdsale.methods.fundingGoalReached().call();
    assert(fundingGoalReached);

    amount = await web3.eth.getBalance(crowdsale.options.address);
    assert.equal(investmentInWei, amount);

    await increaseTime(10000);
    await crowdsale.methods.safeWithdrawal().send({
      from: accounts[0],
      gas: '1000000'
    });

    afterBalance = await web3.eth.getBalance(accounts[0]);
    const initialBalanceInEther = web3.utils.fromWei(initialBalance);
    const afterBalanceInEther = web3.utils.fromWei(afterBalance);
    assert(afterBalanceInEther - initialBalanceInEther > config.crowdsale.fundingGoalInEther * 0.8)
  });

  it('investor can withdraw ether when funding goal is not reached', async () => {
    const investmentInWei = web3.utils.toWei((config.crowdsale.fundingGoalInEther * 0.1).toString(), "ether");
    await web3.eth.sendTransaction({
      to: crowdsale.options.address,
      from: accounts[1],
      value: investmentInWei,
      gas: '1000000'
    });
    let balanceAfterInvestment = await web3.eth.getBalance(accounts[1]);
    await increaseTime(10000);

    await crowdsale.methods.safeWithdrawal().send({
      from: accounts[1],
      gas: '1000000'
    });
    let balanceAfterRefund = await web3.eth.getBalance(accounts[1]);

    const balanceAfterInvestmentInEther = web3.utils.fromWei(balanceAfterInvestment);
    const balanceAfterRefundInEther = web3.utils.fromWei(balanceAfterRefund);
    assert(balanceAfterRefundInEther - balanceAfterInvestmentInEther > config.crowdsale.fundingGoalInEther * 0.1 * 0.8);
  });

});
