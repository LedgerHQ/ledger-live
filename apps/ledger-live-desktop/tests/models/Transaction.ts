import { Fee } from "tests/enum/Fee";
import { Account } from "../enum/Account";
import { Token } from "../enum/Token";

export abstract class Transaction {
  constructor(
    public readonly accountToDebit: Account,
    public readonly accountToCredit: Account,
    public readonly amount: string,
    public readonly speed: Fee,
  ) {}
}
export class BasicTransaction extends Transaction {}
export class TokenTransaction extends Transaction {
  constructor(
    accountToDebit: Account,
    public readonly accountToCredit1: Account,
    public readonly accountToCredit2: Account,
    amount: string,
    speed: Fee,
    public readonly token: Token,
  ) {
    super(accountToDebit, accountToCredit1, amount, speed);
  }
}
