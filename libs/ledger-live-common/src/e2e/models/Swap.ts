import { Transaction } from "./Transaction";
import { Fee } from "../enum/Fee";
import { Account } from "../enum/Account";
import { Provider } from "e2e/enum/Provider";

export type SwapType = Swap;

export class Swap extends Transaction {
  constructor(
    accountToDebit: Account,
    accountToCredit: Account,
    amount: string,
    public provider?: Provider,
    public speed?: Fee,
    public amountToReceive?: string,
    public feesAmount?: string,
  ) {
    super(accountToDebit, accountToCredit, amount);
  }

  public setAmountToReceive(value: string) {
    this.amountToReceive = value;
  }

  public setProvider(provider: Provider) {
    this.provider = provider;
  }

  public setFeesAmount(value: string) {
    this.feesAmount = value;
  }

  public get getAmount(): string {
    return this.amount;
  }

  public get getAccountToDebit(): Account {
    return this.accountToDebit;
  }

  public get getAccountToCredit(): Account {
    return this.accountToCredit;
  }

  public get getProvider() {
    return this.provider;
  }
}
