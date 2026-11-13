import BigNumber from "bignumber.js";
import type { TokenAccount, TokenAccountRaw } from "@ledgerhq/types-live";
import type { XrpTokenAccount, XrpTokenAccountRaw } from "./types";

// The generic coin framework does not serialize the `xrpResources` of `buildTokenAccountShapes`
function assignToTokenAccountRaw(tokenAccount: TokenAccount, tokenAccountRaw: TokenAccountRaw) {
  const { xrpResources } = tokenAccount as XrpTokenAccount;
  if (!xrpResources) return;

  const { limit, ...flags } = xrpResources;
  (tokenAccountRaw as XrpTokenAccountRaw).xrpResources = {
    ...flags,
    ...(limit && { limit: limit.toFixed() }),
  };
}

function assignFromTokenAccountRaw(tokenAccountRaw: TokenAccountRaw, tokenAccount: TokenAccount) {
  const { xrpResources } = tokenAccountRaw as XrpTokenAccountRaw;
  if (!xrpResources) return;

  const { limit, ...flags } = xrpResources;
  (tokenAccount as XrpTokenAccount).xrpResources = {
    ...flags,
    ...(limit && { limit: new BigNumber(limit) }),
  };
}

export default { assignFromTokenAccountRaw, assignToTokenAccountRaw };
