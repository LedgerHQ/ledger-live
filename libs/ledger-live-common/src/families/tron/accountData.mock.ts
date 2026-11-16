import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import type { TronAccount, TronResources } from "./types";

const emptyTronResources = (): TronResources => ({
  frozen: { bandwidth: null, energy: null },
  unFrozen: { bandwidth: null, energy: null },
  delegatedFrozen: { bandwidth: null, energy: null },
  legacyFrozen: { bandwidth: null, energy: null },
  votes: [],
  tronPower: 0,
  energy: new BigNumber(0),
  bandwidth: {
    freeUsed: new BigNumber(0),
    freeLimit: new BigNumber(0),
    gainedUsed: new BigNumber(0),
    gainedLimit: new BigNumber(0),
  },
  unwithdrawnReward: new BigNumber(0),
  lastWithdrawnRewardDate: null,
  lastVotedDate: null,
});

/** A synced Tron account holding the given resources, nothing frozen otherwise. */
export function mockTronAccount(resources: Partial<TronResources> = {}): TronAccount {
  return {
    ...genAccount("tron-account-data", { currency: getCryptoCurrencyById("tron") }),
    tronResources: { ...emptyTronResources(), ...resources },
  };
}
