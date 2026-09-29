import { AccountOperationSchema, type AccountOperation } from "./schema";

const DEFAULT_ACCOUNT_ID = "js:2:ethereum:0xabc:";

export const mockAccountOperation = (overrides: Partial<AccountOperation> = {}): AccountOperation =>
  AccountOperationSchema.parse({
    id: "js:2:ethereum:0xabc:-0xdeadbeef-IN",
    accountId: DEFAULT_ACCOUNT_ID,
    assetId: "ethereum",
    hash: "0xdeadbeef",
    type: "IN",
    value: "1000000000000000000",
    fee: "21000000000000",
    senders: ["0xdef"],
    recipients: ["0xabc"],
    blockHeight: 19_000_000,
    date: "2026-01-31T12:00:00.000Z",
    ...overrides,
  });
