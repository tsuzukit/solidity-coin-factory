# Prerequisite

Install docker for mac

# Software versions

 name         | version       |
|--------------|---------------|
| solidity     | 0.4.17        |
| solidity-compiler       | v0.4.19+commit.c4cbbb05 |


# How to start server

```
$ sh script/start.sh
```

# Setup account

Create `config.json` at root folder

```
{
  "endpoint": "< endpoint create via infura >",
  "address": "< ETH address. This will be token owner >",
  "privateKey": "< ETH private key >",
  "customToken": {
    "initialSupply": "50000", // total supply should be initialSupply * 10 * 10 ** decimals
    "tokenName": "SaunaToken",
    "tokenSymbol": "SAU",
    "decimals": 18 // 18 decimals is strongly recommended
  },
  "customTokenAddress": "< Cutom token contract address >", // Required to dploy crowdsale and charge to it
  "crowdsaleAddress": "< Crowdsale contract address >", // Required to charge token to crowdsale
  "crowdsale": {
    "ifSuccessfulSendTo": "< ETH address that funds are send to after succesfuly funding >",
    "fundingGoalInWei": "100000000000000000",
    "durationInMinutes": 60,
    "costOfEachTokenInWei": "100000000000000000",
  }
}


{
  "endpoint": "< endpoint create via infura >",
  "address": "< ETH address. This will be token owner >",
  "privateKey": "< ETH private key >",
  "customToken": {
    "initialSupply": "50000", // total supply should be initialSupply * 10 * 10 ** decimals
    "tokenName": "SaunaToken",
    "tokenSymbol": "SAU",
    "decimals": 18 // 18 decimals is strongly recommended
  },
  "customTokenAddress": "< Cutom token contract address >", // Required to dploy crowdsale and charge to it
  "crowdsaleAddress": "< Crowdsale contract address >", // Required to charge token to crowdsale
  "crowdsale": {
    "ifSuccessfulSendTo": "< ETH address that funds are send to after succesfuly funding >",
    "fundingGoalInEther": "100",
    "durationInMinutes": 60,
    "costOfEachTokenInEther": "1", // This will sell 100 * 10 ** decimals token to public
  }
}


```

# Compile

```
$ sh script/compile.sh
```

# Test

```
$ sh script/enter.sh
# npm run test
```

# Deploy token

Specify token specs in `config.json`

```
$ sh script/enter.sh
# node deployCustomToken.js
```

Smart contract will be deployed to the network specified by `endpoint` in `config.json`

The token owner will be an address that is specified in `config.json`.


# Start crowdsale

Specify crowdsale specs in `config.json`.

Use token address as `addressOfTokenUsedAsReward`.

Below command will actually deploy crowdsale contract and start crowdsale timer immediately.

```
$ sh script/enter.sh
# node deployCrowdsale.js
```

To actually start selling, tokens has to be charged to the crowdsale contract.
To do so, below command can be used.

```
$ sh script/enter.sh
# node chargeCrowdsale.js
```

The command will automatically charge token required to reach funding goal.

Created smartcontract address is the one that investors send ether to.
When crowdsale contract receives ether, it will transfer tokens to investors automatically.

# TODO

- [x] Write test for `checkGoalReached`
- [x] Write test for `safeWithdrawal`
- [ ] Implement minimum investment threshold 
- [ ] Implement maximum investment threshold 
- [ ] Implement workaround for investment overshoot
- [ ] Transfer token After completing crowdsale
- [ ] Test on Rinkeby


