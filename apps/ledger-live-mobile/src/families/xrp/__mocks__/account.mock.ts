import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { xrpIouToken, xrpTestnetCurrency } from "./currency.mock";

export const XRP_ACCOUNT: Account = {
  ...genAccount("xrp-1", { currency: xrpTestnetCurrency }),
  subAccounts: [],
};

export const XRP_IOU_TOKEN_ACCOUNT: XrpTokenAccount = {
  ...genTokenAccount(0, XRP_ACCOUNT, xrpIouToken),
  xrpResources: {
    isLocked: false,
    isRippling: false,
    limit: new BigNumber(1000),
  },
};

export const XRP_ACCOUNT_WITH_TOKEN: Account = {
  ...XRP_ACCOUNT,
  subAccounts: [XRP_IOU_TOKEN_ACCOUNT],
};

export const XRP_REMOVED_TOKEN_ACCOUNT: XrpTokenAccount = genTokenAccount(
  1,
  XRP_ACCOUNT,
  xrpIouToken,
);

export function overrideWithAccounts(...accounts: Account[]) {
  return <S extends { accounts: { active: unknown[] } }>(state: S): S => {
    return { ...state, accounts: { ...state.accounts, active: accounts } };
  };
}
