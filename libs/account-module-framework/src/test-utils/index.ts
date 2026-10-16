import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { AccountOperation } from "../types";

/** A coin module context for tests: the given config, a silent logger. */
export const testContext = (config: Record<string, unknown> = {}): Context<any> => ({
  config: async () => config as never,
  logger: () => undefined,
});

/** An account operation for tests, confirmed at height 1 unless told otherwise. */
export const anOperation = (fields: Partial<AccountOperation> = {}): AccountOperation => ({
  id: "op",
  hash: "hash",
  type: "IN",
  value: 1n,
  fee: 0n,
  asset: { type: "native" },
  senders: [],
  recipients: [],
  block: { height: 1, hash: "block", time: new Date("2026-01-01T00:00:00.000Z") },
  date: new Date("2026-01-01T00:00:00.000Z"),
  failed: false,
  ...fields,
});
