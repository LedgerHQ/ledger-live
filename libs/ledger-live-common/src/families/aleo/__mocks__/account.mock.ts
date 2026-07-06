import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { AleoAccount } from "../types";
import { aleoCurrency } from "./currency.mock";

export const ALEO_ACCOUNT_1 = { ...genAccount("aleo-1", { currency: aleoCurrency }), index: 0 };

export const makeAleoAccount = (percentage = 0, synced = false): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(0),
    privateBalance: new BigNumber(0),
    unspentPrivateRecords: [],
    provableApi: { scannerStatus: { synced, percentage } },
    lastPrivateSyncDate: null,
  },
});
