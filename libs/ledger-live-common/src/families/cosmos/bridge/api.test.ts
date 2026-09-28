import type { StakingResources } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import BigNumber from "bignumber.js";
import { coinModuleLoaders } from "../../../coin-modules/loaders";
import cosmosBridge, { getDeviceSignOptions } from "./api";

const mockGetRedelegations = jest.fn();
jest.mock("@ledgerhq/coin-cosmos/logic/staking/getRedelegations", () => ({
  getRedelegations: (...args: unknown[]) => mockGetRedelegations(...args),
}));

const cosmos = getCryptoCurrencyById("cosmos");

describe("cosmos bridge", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("computeIntentType", () => {
    it.each([
      [{ mode: "send" }, "send"],
      [{}, "send"],
      [{ mode: undefined }, "send"],
      [{ mode: "delegate" }, "delegate"],
      [{ mode: "undelegate" }, "undelegate"],
      [{ mode: "redelegate" }, "redelegate"],
      [{ mode: "claimReward" }, "claimReward"],
      [{ mode: "compoundReward" }, "compoundReward"],
    ])("maps %o to %s", (transaction, expected) => {
      expect(cosmosBridge(cosmos).computeIntentType!(transaction)).toBe(expected);
    });

    it("throws for an unsupported mode", () => {
      expect(() => cosmosBridge(cosmos).computeIntentType!({ mode: "swap" })).toThrow(
        "Unsupported Cosmos transaction mode: swap",
      );
    });
  });

  describe("bridge surface", () => {
    it("marks staking supported", () => {
      expect(cosmosBridge(cosmos).stakingSupported).toBe(true);
    });
  });

  describe("enrichStakingResources", () => {
    const base: StakingResources = {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    };

    it("populates redelegations fetched for the address, preserving the other fields", async () => {
      const redelegations = [
        {
          validatorSrcAddress: "cosmosvaloper1src",
          validatorDstAddress: "cosmosvaloper1dst",
          amount: new BigNumber("1000000"),
          completionDate: new Date("2026-01-01T00:00:00Z"),
        },
      ];
      mockGetRedelegations.mockResolvedValue(redelegations);

      const result = await cosmosBridge(cosmos).enrichStakingResources!(
        cosmos,
        "cosmos1a",
        [],
        base,
      );

      expect(mockGetRedelegations).toHaveBeenCalledWith("cosmos", "cosmos1a");
      expect(result.redelegations).toEqual(redelegations);
      expect(result.delegatedBalance).toBe(base.delegatedBalance);
    });
  });

  describe("getDeviceSignOptions", () => {
    const cosmosCoins = coinModuleLoaders.find(l => l.family === "cosmos")!.supportedCoins;

    it.each(cosmosCoins)("supplies the chain HRP and signWithPrefix for %s", currencyId => {
      const id = currencyId === "osmosis" ? "osmo" : currencyId;
      const currency = getCryptoCurrencyById(id);
      const chain = cryptoFactory(id);
      const account = { currency } as never;

      expect(getDeviceSignOptions({}, account)).toEqual({
        hrp: chain.prefix,
        signWithPrefix: chain.signWithPrefix,
      });
    });

    it("omits the sign prefix for crypto_org and keeps it for injective", () => {
      expect(
        getDeviceSignOptions({}, { currency: getCryptoCurrencyById("crypto_org") } as never)
          .signWithPrefix,
      ).toBe(false);
      expect(
        getDeviceSignOptions({}, { currency: getCryptoCurrencyById("injective") } as never)
          .signWithPrefix,
      ).toBe(true);
      expect(
        getDeviceSignOptions({}, { currency: getCryptoCurrencyById("injective") } as never).hrp,
      ).toBe("inj");
    });
  });
});
