import { Transaction } from "./Transaction";
import { Fee } from "../enum/Fee";
import { Account } from "../enum/Account";
import { SwapProvider } from "../enum/Provider";

export type SwapType = Swap;

type SwapOptions = {
  accountToDebit: Account;
  accountToCredit: Account;
  amount: string;
  provider?: SwapProvider;
  speed?: Fee;
  amountToReceive?: string;
  feesAmount?: string;
};

export class Swap extends Transaction {
  public provider?: SwapProvider;
  public amountToReceive?: string;
  public feesAmount?: string;

  constructor(options: SwapOptions) {
    super({
      accountToDebit: options.accountToDebit,
      accountToCredit: options.accountToCredit,
      amount: options.amount,
      speed: options.speed,
    });
    this.provider = options.provider;
    this.amountToReceive = options.amountToReceive;
    this.feesAmount = options.feesAmount;
  }

  public setAmountToReceive(value: string) {
    this.amountToReceive = value;
  }

  public setProvider(provider: SwapProvider) {
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
