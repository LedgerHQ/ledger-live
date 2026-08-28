import { MemoNotSupported, StringMemo } from "@ledgerhq/coin-module-framework/api/types";

export type CasperMemo = MemoNotSupported | StringMemo<"transferId">;
