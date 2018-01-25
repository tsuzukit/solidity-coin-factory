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
      arguments: [
        ifSuccessfulSendTo,
        fundingGoalInWei,
        durationInMinutes,
        costOfEachTokenInWei,
        addressOfTokenUsedAsReward
      ]
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
    const investmentInWei = web3.utils.toWei("1", "ether");
    await web3.eth.sendTransaction({
      to: crowdsale.options.address,
      from: accounts[1],
      value: investmentInWei,
      gas: '1000000'
    });

    const investorBalance = await customToken.methods.balanceOf(accounts[1]).call();
    assert.equal(investmentInWei / costOfEachTokenInWei, investorBalance);

    const tokenBalanceAtCrowdsaleAfterPurchase = await customToken.methods.balanceOf(crowdsale.options.address).call();
    assert.equal(tokenBalanceAtCrowdsale, (parseInt(tokenBalanceAtCrowdsaleAfterPurchase) + parseInt(investorBalance)).toString());
  });

  it('Clowdsale closed after deadline', async () => {
    let isClowdsaleClosed = await crowdsale.methods.crowdsaleClosed().call();
    assert(!isClowdsaleClosed);
    await increaseTime(10000);
    try {
      const investmentInWei = web3.utils.toWei("1", "ether");
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
    try {
      const investmentInWei = web3.utils.toWei("10", "ether"); // this is funding goal
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
    fundingGoalReached = await crowdsale.methods.fundingGoalReached().call();
    assert(fundingGoalReached);
    let amount = await web3.eth.getBalance(crowdsale.options.address);
    assert.equal(10, web3.utils.fromWei(amount));
    let amountRaised = await crowdsale.methods.amountRaised().call();
    assert.equal(10, web3.utils.fromWei(amountRaised));
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

  it('can withdraw ether before ending crowdsale', async () => {
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

    const investmentInWei = web3.utils.toWei("10", "ether"); // this is funding goal
    await web3.eth.sendTransaction({
      to: crowdsale.options.address,
      from: accounts[1],
      value: investmentInWei,
      gas: '1000000'
    });
    let fundingGoalReached = await crowdsale.methods.fundingGoalReached().call();
    assert(fundingGoalReached);

    amount = await web3.eth.getBalance(crowdsale.options.address);
    assert.equal(10, web3.utils.fromWei(amount));

    await increaseTime(10000);
    await crowdsale.methods.safeWithdrawal().send({
      from: accounts[0],
      gas: '1000000'
    });

    afterBalance = await web3.eth.getBalance(accounts[0]);
    const initialBalanceInEther = web3.utils.fromWei(initialBalance);
    const afterBalanceInEther = web3.utils.fromWei(afterBalance);
    assert(afterBalanceInEther - initialBalanceInEther > 9)
  });

  it('investor can withdraw ether when funding goal is not reached', async () => {
    const investmentInWei = web3.utils.toWei("2", "ether"); // this is funding goal
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
    assert(balanceAfterRefundInEther - balanceAfterInvestmentInEther > 1.5);
  });

});
