import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { XrpTokenAccount, XrpTokenResources } from "../types";
import {
  xrpIouAsset,
  xrpIouToken,
  xrpMptToken,
  xrpRlusdToken,
  xrpTestnetCurrency,
} from "./xrpCurrency.mock";

export const XRP_ACCOUNT: Account = {
  ...genAccount("xrp-1", { currency: xrpTestnetCurrency }),
  subAccounts: [],
};

export const XRP_IOU_TOKEN_ACCOUNT: XrpTokenAccount = {
  ...genTokenAccount(0, XRP_ACCOUNT, xrpIouToken),
  xrpResources: {
    isLocked: false,
    limit: new BigNumber(1000),
    isRippling: false,
  },
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

export const XRP_ACCOUNT_WITH_TOKEN: Account = {
  ...XRP_ACCOUNT,
  subAccounts: [XRP_IOU_TOKEN_ACCOUNT],
};

export const XRP_IOU_REMOVAL: Operation = {
  id: "op-opt-out",
  hash: "0xabc",
  type: "OPT_OUT",
  value: new BigNumber(0),
  fee: new BigNumber(12),
  senders: [],
  recipients: [],
  blockHeight: null,
  blockHash: null,
  accountId: XRP_ACCOUNT.id,
  date: new Date(),
  extra: {},
  transactionRaw: { amount: "0", recipient: "", ...xrpIouAsset },
};

export function makeXrpTokenAccount(resources: Partial<XrpTokenResources> = {}): XrpTokenAccount {
  return {
    ...genTokenAccount(0, XRP_ACCOUNT, xrpRlusdToken),
    xrpResources: { isLocked: false, ...resources },
  };
}
