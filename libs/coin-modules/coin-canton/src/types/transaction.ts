import type { MemoNotSupported, StringMemo } from "@ledgerhq/coin-module-framework/api/index";
import type { PrepareTransferResponse } from "./gateway";

/** The gateway carries a transfer memo as its `reason`. */
export type CantonMemo = MemoNotSupported | StringMemo<"reason">;

/**
 * `CraftedTransaction.transaction`, JSON-encoded. The generic signer hands the crafted string to
 * the device as is, and hw-app-canton signs a bare string as a transaction hash, so the payload the
 * device signs (`json`) travels inside it, with the party `broadcast` submits under.
 */
export type CantonCraftedEnvelope = {
  party: string;
  serialized: string;
  json: PrepareTransferResponse["json"];
};

/** The `combine` output that `broadcast` submits. */
export type CantonSignedEnvelope = {
  party: string;
  serialized: string;
  signature: string;
};
