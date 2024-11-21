import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export class Delegate {
  constructor(
    public account: Account,
    public amount: string,
    public provider: string,
  ) {}
}
