import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { xrpIouToken, xrpMptToken, xrpTestnetCurrency } from "./currency.mock";

export const XRP_ACCOUNT: Account = {
  ...genAccount("xrp-1", { currency: xrpTestnetCurrency }),
  subAccounts: [],
};

export const XRP_IOU_TOKEN_ACCOUNT: XrpTokenAccount = {
  ...genTokenAccount(0, XRP_ACCOUNT, xrpIouToken),
  xrpResources: { isLocked: false, limit: new BigNumber(1000), isRippling: false },
};

export const XRP_MPT_TOKEN_ACCOUNT: XrpTokenAccount = {
  ...genTokenAccount(1, XRP_ACCOUNT, xrpMptToken),
  xrpResources: { isLocked: false },
};

export const XRP_REMOVED_TOKEN_ACCOUNT: XrpTokenAccount = genTokenAccount(
  2,
  XRP_ACCOUNT,
  xrpIouToken,
);
