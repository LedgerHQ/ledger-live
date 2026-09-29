import { AccountBalanceSchema, type AccountBalance } from "./schema";

const DEFAULT_ACCOUNT_ID = "js:2:ethereum:0xabc:";
const DEFAULT_AT = "2026-01-31T12:00:00.000Z";

export const mockAccountBalance = (overrides: Partial<AccountBalance> = {}): AccountBalance =>
  AccountBalanceSchema.parse({
    accountId: DEFAULT_ACCOUNT_ID,
    assetId: "ethereum",
    balance: "1000000000000000000",
    spendableBalance: "1000000000000000000",
    at: DEFAULT_AT,
    ...overrides,
  });

export const mockTokenAccountBalance = (overrides: Partial<AccountBalance> = {}): AccountBalance =>
  AccountBalanceSchema.parse({
    accountId: `${DEFAULT_ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`,
    assetId: "ethereum/erc20/usd__coin",
    balance: "2500000",
    spendableBalance: "2500000",
    parentId: DEFAULT_ACCOUNT_ID,
    at: DEFAULT_AT,
    ...overrides,
  });
