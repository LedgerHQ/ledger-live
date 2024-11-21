import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

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
    public nftName: string,
    speed?: Fee,
    memoTag?: string,
  ) {
    super(accountToDebit, accountToCredit, "0", speed, memoTag);
  }
}
