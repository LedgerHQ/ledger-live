import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import type { CeloAccount, CeloPendingWithdrawal } from "./types";
import celoBalanceLocks from "./balanceLocks";

const withdrawal = (value: number, index: number): CeloPendingWithdrawal => ({
  value: new BigNumber(value),
  time: new BigNumber(0),
  index,
});

const celo = (locked: number, pendingWithdrawals: CeloPendingWithdrawal[] | null): CeloAccount => ({
  ...genAccount("celo", { currency: getCryptoCurrencyById("celo") }),
  celoResources: {
    registrationStatus: true,
    lockedBalance: new BigNumber(locked),
    nonvotingLockedBalance: new BigNumber(0),
    pendingWithdrawals,
    votes: [],
    electionAddress: null,
    lockedGoldAddress: null,
    maxNumGroupsVotedFor: new BigNumber(10),
  },
});

describe("celoBalanceLocks", () => {
  it("answers the locked CELO as staked, within balance minus spendable", () => {
    const account = celo(100, [withdrawal(5, 0), withdrawal(7, 1)]);
    const synced = { ...account, balance: new BigNumber(130), spendableBalance: new BigNumber(30) };
    const locks = celoBalanceLocks(synced);
    expect(locks).toEqual([{ reason: "staked", amount: "100" }]);
    const locked = locks.reduce((sum, { amount }) => sum.plus(amount), new BigNumber(0));
    expect(locked.lte(synced.balance.minus(synced.spendableBalance))).toBe(true);
  });

  it("answers no lock when nothing is locked", () => {
    expect(celoBalanceLocks(celo(0, null))).toEqual([]);
  });

  it("answers no lock for an account without Celo resources", () => {
    expect(
      celoBalanceLocks(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") })),
    ).toEqual([]);
  });
});
