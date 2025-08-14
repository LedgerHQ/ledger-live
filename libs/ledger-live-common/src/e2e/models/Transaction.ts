import { Fee } from "../enum/Fee";
import { AccountType } from "../enum/Account";
import { Nft } from "../enum/Nft";

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

export class NFTTransaction extends Transaction {
  constructor(
    accountToDebit: AccountType,
    accountToCredit: AccountType,
    public nft: Nft,
    speed?: Fee,
    memoTag?: string,
  ) {
    super(accountToDebit, accountToCredit, "0", speed, memoTag);
  }
}
