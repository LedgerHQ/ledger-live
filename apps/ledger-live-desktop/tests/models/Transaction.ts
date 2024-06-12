import { Account } from "../enum/Account";

export class Transaction {
  constructor(
    public readonly accountToDebit: Account,
    public readonly recipient: string,
    public readonly amount: string,
    public readonly speed: string,
  ) {}
}
