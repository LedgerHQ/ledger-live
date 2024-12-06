import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Nft } from "@ledgerhq/live-common/e2e/enum/Nft";

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
