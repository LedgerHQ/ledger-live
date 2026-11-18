import { AccountIdSchema } from "@domain/entity-account";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { HistoryExportAccount, HistoryExportPort } from "../model/ports";

export const BITCOIN_ACCOUNT: HistoryExportAccount = {
  id: AccountIdSchema.parse("bitcoin-1"),
  name: "Bitcoin 1",
  formattedBalance: "0.5 BTC",
  currency: { id: CryptoOrTokenCurrencyIdSchema.parse("bitcoin"), ticker: "BTC" },
};

export const ETHEREUM_ACCOUNT: HistoryExportAccount = {
  id: AccountIdSchema.parse("ethereum-1"),
  name: "Ethereum 1",
  formattedBalance: "2 ETH",
  currency: { id: CryptoOrTokenCurrencyIdSchema.parse("ethereum"), ticker: "ETH" },
};

export function createFakePort(overrides: Partial<HistoryExportPort> = {}): HistoryExportPort {
  return {
    accounts: [BITCOIN_ACCOUNT, ETHEREUM_ACCOUNT],
    syncAccounts: jest.fn(),
    isSyncing: jest.fn(() => false),
    exportCsv: jest.fn(async () => "saved" as const),
    ...overrides,
  };
}
