import { Fee } from "../enum/Fee";
import { AccountType } from "../enum/Account";

export type TransactionType = Transaction;

export class Transaction {
  constructor(
    public accountToDebit: AccountType,
    public accountToCredit: AccountType,
    public amount: string,
    public speed?: Fee,
    public memoTag?: string,
  ) {}
}
