import { Account } from "../enum/Account";

export type DelegateType = Delegate;

export class Delegate {
  constructor(
    public account: Account,
    public amount: string,
    public provider: string,
  ) {}
}
