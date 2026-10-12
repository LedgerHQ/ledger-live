import type { AccountLayer } from "@ledgerhq/ledger-wallet-framework/api/types";
import { getSerializedAddressParameters } from "./exchange";
import { decorateOptimisticOperation, postSync } from "./pending";
import { completeIntent } from "./selection";
import { getAccountShape } from "./sync";

/** The bitcoin family's account layer on the generic bridge (ADR-065). */
export const bitcoinAccountLayer: AccountLayer = {
  getAccountShape: (info, _syncConfig, dependencies) => getAccountShape(info, dependencies),
  completeIntent,
  postSync,
  decorateOptimisticOperation,
  getSerializedAddressParameters,
};

export { computeIntentType } from "./selection";
