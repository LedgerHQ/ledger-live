import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { HederaAccount, HederaResources } from "@ledgerhq/live-common/families/hedera/types";
import { hederaCurrency } from "./currency.mock";

export const HEDERA_ACCOUNT_1 = {
  ...genAccount("hedera-1", { currency: hederaCurrency }),
  index: 0,
  hederaResources: {
    maxAutomaticTokenAssociations: 0,
    isAutoTokenAssociationEnabled: false,
    delegation: {
      nodeId: 0,
      delegated: new BigNumber(5_000_000_000),
      pendingReward: new BigNumber(500_000),
    },
  },
};

export const baseResources: HederaResources = {
  maxAutomaticTokenAssociations: 0,
  isAutoTokenAssociationEnabled: false,
  delegation: null,
};

export const makeHederaAccount = (resourceOverrides?: Partial<HederaResources>): HederaAccount =>
  ({
    ...HEDERA_ACCOUNT_1,
    hederaResources: { ...baseResources, ...resourceOverrides },
  }) as HederaAccount;
