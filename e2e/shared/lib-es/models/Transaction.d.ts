import { Fee } from "../enum/Fee";
import { AccountType } from "../enum/Account";
export type TransactionType = Transaction;
export declare class Transaction {
    accountToDebit: AccountType;
    accountToCredit: AccountType;
    amount: string;
    speed?: Fee | undefined;
    memoTag?: string | undefined;
    recipientAddress?: string;
    constructor(accountToDebit: AccountType, accountToCredit: AccountType, amount: string, speed?: Fee | undefined, memoTag?: string | undefined);
}
//# sourceMappingURL=Transaction.d.ts.map