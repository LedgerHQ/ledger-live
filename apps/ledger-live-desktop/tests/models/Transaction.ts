import { Fee } from "tests/enum/Fee";
import { Account } from "../enum/Account";

export class Transaction {
  constructor(
    public accountToDebit: Account,
    public accountToCredit: Account,
    public amount: string,
    public speed: Fee,
  ) {}
}
