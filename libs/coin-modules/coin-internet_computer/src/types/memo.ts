import type { MemoNotSupported, StringMemo } from "@ledgerhq/coin-module-framework/api/index";

/** The ledger transfer memo, a Nat64 carried as its decimal string. */
export type IcpMemo = MemoNotSupported | StringMemo<"memo">;
