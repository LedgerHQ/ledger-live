import type { StakingResources } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import BigNumber from "bignumber.js";
import { coinModuleLoaders } from "../../../coin-modules/loaders";
import { buildOptimisticOperation } from "../../../bridge/generic-coin-framework/utils";
import cosmosBridge, { describeOptimisticOperation, getDeviceSignOptions } from "./api";

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

    it("marks the account sequence as synced", () => {
      expect(cosmosBridge(cosmos).accountSequenceSupported).toBe(true);
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

      expect(mockGetRedelegations).toHaveBeenCalledWith("cosmos", "uatom", "cosmos1a");
      expect(result.redelegations).toEqual(redelegations);
      expect(result.delegatedBalance).toBe(base.delegatedBalance);
    });
  });

  describe("describeOptimisticOperation", () => {
    const account = { currency: cosmos } as never;

    it("leaves a send to the generic mapping", () => {
      expect(
        describeOptimisticOperation("send", account, { mode: "send", recipient: "cosmos1r" }),
      ).toBeUndefined();
    });

    it.each(["delegate", "undelegate", "claimReward", "compoundReward"])(
      "exposes the validator and amount of a %s on extra.validators",
      mode => {
        const amount = new BigNumber(1_000_000);
        const descriptor = describeOptimisticOperation(mode, account, {
          mode,
          valAddress: "cosmosvaloper1val",
          amount,
        });

        expect(descriptor?.extra).toEqual({
          validators: [{ address: "cosmosvaloper1val", amount }],
        });
        expect(descriptor?.type).toBeUndefined();
        expect(descriptor?.value).toBeUndefined();
      },
    );

    it("exposes the destination as validator and the origin as sourceValidator of a redelegation", () => {
      const amount = new BigNumber(42);
      const descriptor = describeOptimisticOperation("redelegate", account, {
        mode: "redelegate",
        valAddress: "cosmosvaloper1src",
        dstValAddress: "cosmosvaloper1dst",
        amount,
      });

      expect(descriptor?.extra).toEqual({
        validators: [{ address: "cosmosvaloper1dst", amount }],
        sourceValidator: "cosmosvaloper1src",
      });
    });

    it("surfaces the validator on the operation built after signing a delegation", () => {
      const operation = buildOptimisticOperation(
        {
          id: "js:2:cosmos:cosmos1sender:",
          freshAddress: "cosmos1sender",
          currency: cosmos,
        } as never,
        {
          family: "cosmos",
          mode: "delegate",
          recipient: "",
          valAddress: "cosmosvaloper1val",
          amount: new BigNumber(1_000_000),
          fees: new BigNumber(5_000),
        } as never,
        7n,
        describeOptimisticOperation,
      );

      expect(operation.type).toBe("DELEGATE");
      expect(operation.extra).toMatchObject({
        validators: [{ address: "cosmosvaloper1val", amount: new BigNumber(1_000_000) }],
      });
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
