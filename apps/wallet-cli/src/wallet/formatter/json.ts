import { serializeV1 } from "../../shared/accountDescriptor";
import type { Balance, Operation, DiscoveredAccount } from "../models";
import type { HumanFormatter } from "./human";

export type JsonBalance = { asset: string; amount: string };

export type JsonOperation = {
  accountId: string;
  asset: string;
  type: string;
  value: string;
  fee: string;
  senders: string[];
  recipients: string[];
  blockHeight: number | null;
  date: string;
  hash: string;
  parentId?: string;
};

export class JsonFormatter {
  constructor(private readonly human: HumanFormatter) {}

  async balances(balances: Balance[]): Promise<JsonBalance[]> {
    return Promise.all(
      balances.map(async b => ({
        asset: b.assetId,
        amount: await this.human.formatAmount(b.balance, b.assetId),
      })),
    );
  }

  async operations(
    ops: Operation[],
    currencyId: string,
    accountV1Str: string,
  ): Promise<JsonOperation[]> {
    return Promise.all(
      ops.map(async op => ({
        accountId: accountV1Str,
        asset: op.assetId,
        type: op.type,
        value: await this.human.formatAmount(op.value, op.assetId),
        fee: await this.human.formatAmount(op.fee, currencyId),
        senders: op.senders,
        recipients: op.recipients,
        blockHeight: op.blockHeight,
        date: op.date,
        hash: op.hash,
        ...(op.parentId === undefined ? {} : { parentId: op.parentId }),
      })),
    );
  }

  static discoveredAccounts(accounts: DiscoveredAccount[]): string[] {
    return accounts.map(a => serializeV1(a.descriptor));
  }
}
