import { BigNumber } from "bignumber.js";
import type { TokenAccount, TokenAccountRaw } from "@ledgerhq/types-live";
import type { XrpTokenAccount, XrpTokenAccountRaw } from "./types";

/**
 * Persist the `xrpResources` the bridge's `buildTokenAccountShapes` puts on token accounts: the
 * generic coin framework pipeline is family-agnostic and does not serialize them.
 */
function assignToTokenAccountRaw(tokenAccount: TokenAccount, tokenAccountRaw: TokenAccountRaw) {
  const { xrpResources } = tokenAccount as XrpTokenAccount;
  if (!xrpResources) return;

  const { limit, ...flags } = xrpResources;
  (tokenAccountRaw as XrpTokenAccountRaw).xrpResources = {
    ...flags,
    ...(limit !== undefined && { limit: limit.toFixed() }),
  };
}

function assignFromTokenAccountRaw(tokenAccountRaw: TokenAccountRaw, tokenAccount: TokenAccount) {
  const { xrpResources } = tokenAccountRaw as XrpTokenAccountRaw;
  if (!xrpResources) return;

  const { limit, ...flags } = xrpResources;
  (tokenAccount as XrpTokenAccount).xrpResources = {
    ...flags,
    ...(limit !== undefined && { limit: new BigNumber(limit) }),
  };
}

export default { assignFromTokenAccountRaw, assignToTokenAccountRaw };
