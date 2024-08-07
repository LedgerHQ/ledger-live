import { Fee } from "tests/enum/Fee";
import { Account } from "../enum/Account";

export class Transaction {
  constructor(
    public readonly accountToDebit: Account,
    public readonly accountToCredit: Account,
    public readonly amount: string,
    public readonly speed: Fee,
  ) {}
}
