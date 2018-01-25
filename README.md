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
  "endpoint": "https://rinkeby.infura.io/<TOKEN from Infura>",
  "address": "<ETH Address>",
  "privateKey": "<ETH Private Key>"
  "customToken": {
    "initialSupply": "1000000",
    "tokenName": "SaunaToken",
    "tokenSymbol": "SAU"
  },
  "crowdsale": {
    "ifSuccessfulSendTo": "<ETH Address>",
    "fundingGoalInWei": 100000000000000,
    "durationInMinutes": 10,
    "costOfEachTokenInWei": 1000000000000000,
    "addressOfTokenUsedAsReward": "<ETH Address>"
  }
}
```

# Compile

```
$ sh script/compile.sh
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

Below command will actually deploy crowdsale contract and start crowdsale immediately.

```
$ sh script/enter.sh
# node deployCrowdsale.js
```

Created smartcontract address is the one that investors send ether to.
When crowdsale contract recieves ether, it will transfer tokens to investors.

# TODO

- [x] Write test for `checkGoalReached`
- [x] Write test for `safeWithdrawal`
- [ ] Implement minimum investment threshold 
- [ ] Implement maximum investment threshold 
- [ ] Implement workaround for investment overshoot
- [ ] Transfer token After completing crowdsale
- [ ] Test on Rinkeby


