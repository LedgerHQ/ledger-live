import { Account } from "../enum/Account";

export type DelegateType = Delegate;

type DelegateOptions = {
  account: Account;
  amount: string;
  provider: string;
  validatorAddress?: string;
};

export class Delegate {
  public account: Account;
  public amount: string;
  public provider: string;
  public validatorAddress?: string;

  constructor(options: DelegateOptions) {
    this.account = options.account;
    this.amount = options.amount;
    this.provider = options.provider;
    this.validatorAddress = options.validatorAddress;
  }
}
