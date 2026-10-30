import { AccountOperationSchema, type AccountOperation } from "./schema";

type AccountOperationInput = {
  id: string;
  hash: string;
  type: string;
  assetId: string;
  value: string;
  fee: string;
  senders: string[];
  recipients: string[];
  blockHeight: number | null;
  date: string;
  hasFailed?: boolean;
  parentId?: string;
};

export function mockAccountOperation(overrides?: Partial<AccountOperationInput>): AccountOperation {
  return AccountOperationSchema.parse({
    id: "op-1",
    hash: "0xhash1",
    type: "OUT",
    assetId: "ethereum",
    value: "10",
    fee: "1",
    senders: ["0xsender"],
    recipients: ["0xrecipient"],
    blockHeight: 100,
    date: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });
}
