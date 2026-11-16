import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { mockTronAccount } from "./accountData.mock";
import tronStaking from "./staking";

const amount = (value: number) => ({ amount: new BigNumber(value) });
const past = new Date("2020-01-01T00:00:00.000Z");
const future = new Date("2999-01-01T00:00:00.000Z");

describe("tronStaking", () => {
  it("maps votes to active positions worth one TRX per vote with their count, the rest of the frozen TRX as inactive", () => {
    const account = mockTronAccount({
      frozen: { bandwidth: amount(2_000_000), energy: amount(3_500_000) },
      delegatedFrozen: { bandwidth: null, energy: amount(1_000_000) },
      votes: [
        { name: "a", address: "TSR1", voteCount: 4 },
        { name: "b", address: "TSR2", voteCount: 1 },
      ],
    });
    expect(tronStaking(account).positions).toEqual([
      {
        id: "vote:TSR1",
        assetId: "tron",
        validatorId: "TSR1",
        state: "active",
        amount: "4000000",
        votes: "4",
      },
      {
        id: "vote:TSR2",
        assetId: "tron",
        validatorId: "TSR2",
        state: "active",
        amount: "1000000",
        votes: "1",
      },
      { id: "frozen", assetId: "tron", state: "inactive", amount: "1500000" },
    ]);
  });

  it("maps unfreezing TRX to unlocking positions, withdrawable once expired", () => {
    const account = mockTronAccount({
      unFrozen: {
        bandwidth: [{ ...amount(10), expireTime: future }],
        energy: [{ ...amount(20), expireTime: past }],
      },
    });
    expect(tronStaking(account).positions).toEqual([
      {
        id: `unfreezing:bandwidth:${future.getTime()}:0`,
        assetId: "tron",
        state: "deactivating",
        amount: "10",
        unlockAt: future.toISOString(),
      },
      {
        id: `unfreezing:energy:${past.getTime()}:0`,
        assetId: "tron",
        state: "withdrawable",
        amount: "20",
        unlockAt: past.toISOString(),
      },
    ]);
  });

  it("carries the unwithdrawn reward account-wide, on no position", () => {
    expect(tronStaking(mockTronAccount({ unwithdrawnReward: new BigNumber(42) }))).toEqual({
      positions: [],
      rewards: [{ assetId: "tron", amount: "42" }],
    });
  });

  it("answers no position nor reward when nothing is frozen nor voted", () => {
    expect(tronStaking(mockTronAccount())).toEqual({ positions: [] });
  });

  it("answers no position for an account without Tron resources", () => {
    expect(tronStaking(genAccount("eth", { currency: getCryptoCurrencyById("ethereum") }))).toEqual(
      { positions: [] },
    );
  });
});
