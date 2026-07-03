"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Swap = void 0;
const Transaction_1 = require("./Transaction");
class Swap extends Transaction_1.Transaction {
    provider;
    speed;
    amountToReceive;
    feesAmount;
    constructor(accountToDebit, accountToCredit, amount, provider, speed, amountToReceive, feesAmount) {
        super(accountToDebit, accountToCredit, amount);
        this.provider = provider;
        this.speed = speed;
        this.amountToReceive = amountToReceive;
        this.feesAmount = feesAmount;
    }
    setAmountToReceive(value) {
        this.amountToReceive = value;
    }
    setProvider(provider) {
        this.provider = provider;
    }
    setFeesAmount(value) {
        this.feesAmount = value;
    }
    get getAmount() {
        return this.amount;
    }
    get getAccountToDebit() {
        return this.accountToDebit;
    }
    get getAccountToCredit() {
        return this.accountToCredit;
    }
    get getProvider() {
        return this.provider;
    }
}
exports.Swap = Swap;
//# sourceMappingURL=Swap.js.map