export class Transaction {
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
//# sourceMappingURL=Transaction.js.map