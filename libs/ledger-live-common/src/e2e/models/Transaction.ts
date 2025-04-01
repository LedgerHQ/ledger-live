import { Fee } from "../enum/Fee";
import { Account } from "../enum/Account";
import { Nft } from "../enum/Nft";

export type TransactionType = Transaction;

export class Transaction {
  constructor(
    public accountToDebit: Account,
    public accountToCredit: Account,
    public amount: string,
    public speed?: Fee,
    public memoTag?: string,
  ) {}
}

export class NFTTransaction extends Transaction {
  constructor(
    accountToDebit: Account,
    accountToCredit: Account,
    public nft: Nft,
    speed?: Fee,
    memoTag?: string,
  ) {
    super(accountToDebit, accountToCredit, "0", speed, memoTag);
  }
}
