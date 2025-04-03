import { Transaction } from "./Transaction";
import { Fee } from "../enum/Fee";
import { Account } from "../enum/Account";

export type SwapType = Swap;

export class Swap extends Transaction {
  constructor(
    accountToDebit: Account,
    accountToCredit: Account,
    amount: string,
    speed: Fee,
    public amountToReceive?: string,
    public feesAmount?: string,
  ) {
    super(accountToDebit, accountToCredit, amount, speed);
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
