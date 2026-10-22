import type { Account, StakingResources } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import cryptoFactory from "@ledgerhq/coin-cosmos/chain/chain";
import BigNumber from "bignumber.js";
import { coinModuleLoaders } from "../../../coin-modules/loaders";
import {
  buildOptimisticOperation,
  getNativeSpendableAfterPending,
  getPendingNativeSpent,
} from "../../../bridge/generic-coin-framework/utils";
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

  describe("describeOptimisticOperation", () => {
    const SOURCE = "cosmosvaloper1source";
    const DESTINATION = "cosmosvaloper1destination";
    const amount = new BigNumber(1_000_000);
    const account = {
      id: "js:2:cosmos:cosmos1sender:",
      freshAddress: "cosmos1sender",
      currency: cosmos,
    } as unknown as Account;

    it.each(["delegate", "claimReward", "compoundReward"])(
      "keeps the validator and amount of a %s",
      mode => {
        expect(describeOptimisticOperation(mode, account, { amount, valAddress: SOURCE })).toEqual({
          extra: { validators: [{ address: SOURCE, amount }] },
        });
      },
    );

    it("records no value for an undelegate, keeping the moved stake on the validator", () => {
      expect(
        describeOptimisticOperation("undelegate", account, { amount, valAddress: SOURCE }),
      ).toEqual({
        value: new BigNumber(0),
        extra: { validators: [{ address: SOURCE, amount }] },
      });
    });

    it("records no value for a redelegate, keeping its destination and source validators", () => {
      expect(
        describeOptimisticOperation("redelegate", account, {
          amount,
          valAddress: SOURCE,
          dstValAddress: DESTINATION,
        }),
      ).toEqual({
        value: new BigNumber(0),
        extra: { validators: [{ address: DESTINATION, amount }], sourceValidator: SOURCE },
      });
    });

    it.each([
      ["undelegate", { valAddress: SOURCE }],
      ["redelegate", { valAddress: SOURCE, dstValAddress: DESTINATION }],
    ])("reserves only the fee of a pending %s against liquid funds", (mode, validators) => {
      const fees = new BigNumber(5_000);
      const operation = buildOptimisticOperation(
        account,
        {
          family: "cosmos",
          mode,
          amount: new BigNumber(10_000_000),
          fees,
          recipient: "",
          ...validators,
        } as never,
        4n,
        cosmosBridge(cosmos).describeOptimisticOperation,
      );
      const pendingAccount = {
        ...account,
        spendableBalance: new BigNumber(1_000_000),
        pendingOperations: [operation],
      } as Account;

      expect(operation.value).toEqual(new BigNumber(0));
      expect(getPendingNativeSpent([operation])).toEqual(fees);
      expect(getNativeSpendableAfterPending(pendingAccount)).toEqual(new BigNumber(995_000));
    });

    it("reserves the delegated amount and the fee of a pending delegate", () => {
      const operation = buildOptimisticOperation(
        account,
        {
          family: "cosmos",
          mode: "delegate",
          amount,
          fees: new BigNumber(5_000),
          recipient: "",
          valAddress: SOURCE,
        } as never,
        4n,
        cosmosBridge(cosmos).describeOptimisticOperation,
      );

      expect(getPendingNativeSpent([operation])).toEqual(new BigNumber(1_005_000));
    });

    it("leaves a send and a staking transaction without validator to the generic description", () => {
      expect(describeOptimisticOperation("send", account, { amount })).toBeUndefined();
      expect(describeOptimisticOperation("delegate", account, { amount, valAddress: "" })).toBe(
        undefined,
      );
    });

    it("puts the validators on the pending operation the generic signer builds", () => {
      const operation = buildOptimisticOperation(
        account,
        {
          family: "cosmos",
          mode: "redelegate",
          amount,
          fees: new BigNumber(5_000),
          recipient: "",
          valAddress: SOURCE,
          dstValAddress: DESTINATION,
        } as never,
        4n,
        cosmosBridge(cosmos).describeOptimisticOperation,
      );

      expect(operation.type).toBe("REDELEGATE");
      expect(operation.extra).toMatchObject({
        validators: [{ address: DESTINATION, amount }],
        sourceValidator: SOURCE,
        ledgerOpType: "REDELEGATE",
      });
    });
  });
});
