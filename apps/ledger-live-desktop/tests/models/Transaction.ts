import { Account } from "../enum/Account";
import { Token } from "../enum/Token";
export class Transaction {
  constructor(
    public readonly accountToDebit: Account,
    public readonly accountToCredit: Account,
    public readonly amount: string,
    public readonly speed: string,
  ) {}
}
export class TokenTransaction {
  constructor(
    public readonly accountToDebit: Account,
    public readonly accountToCredit1: Account,
    public readonly accountToCredit2: Account,
    public readonly amount: string,
    public readonly speed: string,
    public readonly token: Token,
  ) {}
}
