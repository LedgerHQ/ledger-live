"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
class Transaction {
    accountToDebit;
    accountToCredit;
    amount;
    speed;
    memoTag;
    recipientAddress;
    constructor(accountToDebit, accountToCredit, amount, speed, memoTag) {
        this.accountToDebit = accountToDebit;
        this.accountToCredit = accountToCredit;
        this.amount = amount;
        this.speed = speed;
        this.memoTag = memoTag;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map