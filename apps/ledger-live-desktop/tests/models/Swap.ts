import { Transaction } from "tests/models/Transaction";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider, Rate } from "@ledgerhq/live-common/e2e/enum/Swap";

export class Swap extends Transaction {
  provider: Provider;
  rate: Rate;

  constructor(
    accountToDebit: Account,
    accountToCredit: Account,
    amount: string,
    speed: Fee,
    provider: Provider,
    rate: Rate,
    public amountToReceive?: string,
    public feesAmount?: string,
  ) {
    super(accountToDebit, accountToCredit, amount, speed);
    this.provider = provider;
    this.rate = rate;
  }

  public setAmountToReceive(value: string) {
    this.amountToReceive = value;
  }

  public setFeesAmount(value: string) {
    this.feesAmount = value;
  }

  public get getAmount(): string {
    return this.amount;
  }
}
