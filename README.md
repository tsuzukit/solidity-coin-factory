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
}
```

# Token setup

Change name of  `contracts/Template.sol` to `TOKEN_NAME/sol` where TOKEN_NAME is whatever the name of token you would like to create.

Replace token specs in `TOKEN_NAME.sol`

```
TOKEN_NAME
TOKEN_VOLUME
TOKEN_SYMBOL
DECIMALS
```

Set `TOKEN_NAME` in `compile.js`

# Deploy token

```
$ sh script/enter.sh
$ node deploy.js
```

Smart contract will be deployed to the network specified by `endpoint` in `config.json`

The token owner will be an address that is specified in `config.json`.


