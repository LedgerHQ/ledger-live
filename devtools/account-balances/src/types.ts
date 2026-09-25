import type { AmountUnit } from "@shared/amount-format";

export type { AmountUnit };

export interface StoredBalance {
  readonly assetId: string;
  readonly unit?: AmountUnit;
  readonly value: string;
  readonly spendable: string;
  readonly at: string;
}

export interface BalanceStatus {
  readonly pending: boolean;
  readonly sourceId?: string;
  readonly error?: string;
}

export interface AccountBalanceRow {
  readonly accountId: string;
  readonly name: string;
  readonly currencyId: string;
  readonly address: string;
  readonly granular: boolean;
  readonly balance?: StoredBalance;
  readonly tokens: readonly StoredBalance[];
  readonly status: BalanceStatus;
}

export interface AccountBalancesToolProps {
  readonly accounts: readonly AccountBalanceRow[];
  readonly onRead: (accountId: string) => void;
  readonly onReadAll: () => void;
  readonly ready: boolean;
}
