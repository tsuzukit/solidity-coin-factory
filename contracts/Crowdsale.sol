pragma solidity ^0.4.16;

interface token {
    function transfer(address receiver, uint amount) public;
}

contract Crowdsale {
    address public owner;
    address public beneficiary;
    uint public fundingGoal;
    uint public amountRaised;
    uint public deadline;
    uint public price;
    token public tokenReward;
    uint8 public decimals;
    mapping(address => uint256) public balanceOf;
    bool public fundingGoalReached = false;
    bool public crowdsaleClosed = false;

    event GoalReached(address recipient, uint totalAmountRaised);
    event FundTransfer(address backer, uint amount, bool isContribution);

    /**
     * Constrctor function
     *
     * Setup the owner
     */
    function Crowdsale (
        address ifSuccessfulSendTo,
        uint fundingGoalInWei,
        uint durationInMinutes,
        uint costOfEachTokenInWei,
        address addressOfTokenUsedAsReward,
        uint8 tokenDecimals
    ) public {
        owner = msg.sender;
        beneficiary = ifSuccessfulSendTo;
        fundingGoal = fundingGoalInWei;
        deadline = now + durationInMinutes * 1 minutes;
        price = costOfEachTokenInWei;
        tokenReward = token(addressOfTokenUsedAsReward);
        decimals = tokenDecimals;
    }

    /**
     * Fallback function
     *
     * The function without name is the default function that is called whenever anyone sends funds to a contract
     */
    function () payable public {
        require(!crowdsaleClosed);
        uint256 amount = msg.value;
        balanceOf[msg.sender] += amount;
        amountRaised += amount;
        tokenReward.transfer(msg.sender, amount * 10 ** uint256(decimals) / price);
        FundTransfer(msg.sender, amount, true);
        checkGoalReached();
    }

    modifier afterDeadline() { if (now >= deadline) _; }
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    /**
     * Transfer token back to owner in the case there is left over after token sale
     */
    function transferTokenBackToOwner(uint256 amount) onlyOwner public {
        tokenReward.transfer(owner, amount);
    }

    /**
     * Check if goal was reached
     *
     * Checks if the goal or time limit has been reached and ends the campaign
     */
    function checkGoalReached() public {
        if (now >= deadline) {
            crowdsaleClosed = true;
        }
        if (amountRaised >= fundingGoal){
            fundingGoalReached = true;
            GoalReached(beneficiary, amountRaised);
            crowdsaleClosed = true;
        }
    }

    /**
     * Withdraw the funds
     *
     * Checks to see if goal or time limit has been reached, and if so, and the funding goal was reached,
     * sends the entire amount to the beneficiary. If goal was not reached, each contributor can withdraw
     * the amount they contributed.
     */
    function safeWithdrawal() afterDeadline public {
        if (!fundingGoalReached) {
            uint amount = balanceOf[msg.sender];
            balanceOf[msg.sender] = 0;
            if (amount > 0) {
                if (msg.sender.send(amount)) {
                    FundTransfer(msg.sender, amount, false);
                } else {
                    balanceOf[msg.sender] = amount;
                }
            }
        }

        if (fundingGoalReached && beneficiary == msg.sender) {
            if (beneficiary.send(amountRaised)) {
                FundTransfer(beneficiary, amountRaised, false);
            } else {
                //If we fail to send the funds to beneficiary, unlock funders balance
                fundingGoalReached = false;
            }
        }
    }
}

