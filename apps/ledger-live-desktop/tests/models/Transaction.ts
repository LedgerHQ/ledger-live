import { Account } from "../enum/Account";
import { Token } from "../enum/Token";

export abstract class Transaction {
  constructor(
    public readonly accountToDebit: Account,
    public readonly accountToCredit: Account,
    public readonly amount: string,
    public readonly speed: string,
  ) {}
}
export class BasicTransaction extends Transaction {
  constructor(accountToDebit: Account, accountToCredit: Account, amount: string, speed: string) {
    super(accountToDebit, accountToCredit, amount, speed);
  }
}
export class TokenTransaction extends Transaction {
  constructor(
    accountToDebit: Account,
    public readonly accountToCredit1: Account,
    public readonly accountToCredit2: Account,
    amount: string,
    speed: string,
    public readonly token: Token,
  ) {
    super(accountToDebit, accountToCredit1, amount, speed);
  }
}
