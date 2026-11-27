import { Fee } from "../enum/Fee";
import { AccountType } from "../enum/Account";

export type TransactionType = Transaction;

type TransactionOptions = {
  accountToDebit: AccountType;
  accountToCredit: AccountType;
  amount: string;
  speed?: Fee;
  memoTag?: string;
};

export class Transaction {
  public accountToDebit: AccountType;
  public accountToCredit: AccountType;
  public amount: string;
  public speed?: Fee;
  public memoTag?: string;
  public recipientAddress?: string;
  public expectedFee?: string;

  constructor(options: TransactionOptions) {
    this.accountToDebit = options.accountToDebit;
    this.accountToCredit = options.accountToCredit;
    this.amount = options.amount;
    this.speed = options.speed;
    this.memoTag = options.memoTag;
  }
}
