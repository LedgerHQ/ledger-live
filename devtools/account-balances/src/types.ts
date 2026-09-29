/** Enough of a currency unit to render an amount: how many decimals, and what to call it. */
export interface AmountUnit {
  readonly code: string;
  readonly magnitude: number;
}

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
