import { Account } from "../enum/Account";

export class Delegate {
  constructor(
    public account: Account,
    public amount: string,
    public provider: string,
  ) {}
}
