import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import * as nearBridge from "./api";

const { computeIntentType, describeOptimisticOperation } = nearBridge;
const bridgeApi = nearBridge.default();

describe("generic-coin-framework NEAR bridge api", () => {
  describe("computeIntentType", () => {
    it.each(["send", "stake", "unstake"] as const)("returns '%s' unchanged", mode => {
      expect(computeIntentType({ mode })).toBe(mode);
    });

    it("maps NEAR's 'withdraw' onto the framework's 'finalize_unstake'", () => {
      expect(computeIntentType({ mode: "withdraw" })).toBe("finalize_unstake");
    });

    it.each([{}, { mode: undefined }, { mode: null }])(
      "falls back to 'send' when mode is absent (%p)",
      transaction => {
        expect(computeIntentType(transaction)).toBe("send");
      },
    );

    it("throws for an unsupported string mode", () => {
      expect(() => computeIntentType({ mode: "changeTrust" })).toThrow(
        "Unsupported transaction mode: changeTrust",
      );
    });

    it("throws a TypeError when mode is a non-string value", () => {
      expect(() => computeIntentType({ mode: 42 })).toThrow(TypeError);
      expect(() => computeIntentType({ mode: 42 })).toThrow("Unsupported transaction mode: 42");
    });

    it("reports an object mode without collapsing it to [object Object]", () => {
      expect(() => computeIntentType({ mode: { kind: "stake" } })).toThrow(
        'Unsupported transaction mode: {"kind":"stake"}',
      );
    });
  });

  describe("describeOptimisticOperation", () => {
    it("types a withdraw the way the indexer types it, not WITHDRAW_UNBONDED", () => {
      expect(describeOptimisticOperation("withdraw")).toEqual({ type: "WITHDRAW_UNSTAKED" });
    });

    it.each(["send", "stake", "unstake"])("defers to the generic mapping for '%s'", mode => {
      expect(describeOptimisticOperation(mode)).toBeUndefined();
    });
  });

  describe("getKnownValidatorIds", () => {
    it("joins the pools of the generic positions and of the legacy NEAR resources", () => {
      const account = {
        stakingPositions: [{ delegate: "a.poolv1.near" }, { delegate: "b.poolv1.near" }, {}],
        nearResources: {
          stakingPositions: [{ validatorId: "b.poolv1.near" }, { validatorId: "c.poolv1.near" }],
        },
      };
      expect(nearBridge.getKnownValidatorIds(account as never)).toEqual([
        "a.poolv1.near",
        "b.poolv1.near",
        "c.poolv1.near",
      ]);
    });

    it("returns no pool for an account without positions", () => {
      expect(nearBridge.getKnownValidatorIds({} as never)).toEqual([]);
    });

    it("is part of the bridge", () => {
      expect(nearBridge.default().getKnownValidatorIds).toBe(nearBridge.getKnownValidatorIds);
    });
  });

  describe("getStakingCallValidatorId", () => {
    it("reads the pool coin-near found in the actions, whatever the operation type", () => {
      const operation = { type: "OUT", extra: { stakingPool: "a.poolv1.near" } };
      expect(nearBridge.getStakingCallValidatorId(operation as never)).toBe("a.poolv1.near");
    });

    it("names no pool for an operation without one", () => {
      expect(nearBridge.getStakingCallValidatorId({ extra: {} } as never)).toBeUndefined();
    });

    it("is part of the bridge", () => {
      expect(nearBridge.default().getStakingCallValidatorId).toBe(
        nearBridge.getStakingCallValidatorId,
      );
    });
  });

  describe("isOperationSettled", () => {
    it("is false for an operation read before its outcome was indexed", () => {
      expect(nearBridge.isOperationSettled({ extra: { outcomePending: true } } as never)).toBe(
        false,
      );
    });

    it("is true for any other operation", () => {
      expect(nearBridge.isOperationSettled({ extra: {} } as never)).toBe(true);
    });

    it("is part of the bridge", () => {
      expect(nearBridge.default().isOperationSettled).toBe(nearBridge.isOperationSettled);
    });
  });

  describe("needsValidatorListing", () => {
    it("is true for a call another account relayed", () => {
      expect(nearBridge.needsValidatorListing({ extra: { relayedCall: true } } as never)).toBe(
        true,
      );
    });

    it("is false for any other operation", () => {
      expect(nearBridge.needsValidatorListing({ extra: {} } as never)).toBe(false);
    });

    it("is part of the bridge", () => {
      expect(nearBridge.default().needsValidatorListing).toBe(nearBridge.needsValidatorListing);
    });
  });

  describe("default export", () => {
    it("declares staking support", () => {
      expect(bridgeApi.stakingSupported).toBe(true);
    });

    it("opts into the generic staking-positions account shape", () => {
      expect(bridgeApi.usesStakingPositions).toBe(true);
    });

    it("sums the native balance partitions, as coin-near reports the staking positions apart", () => {
      expect(bridgeApi.partitionsNativeBalance).toBe(true);
    });

    it("wires computeIntentType so the framework picks it up over its own whitelist", () => {
      expect(bridgeApi.computeIntentType).toBe(computeIntentType);
      expect(bridgeApi.computeIntentType?.({ mode: "withdraw" })).toBe("finalize_unstake");
    });

    it("wires describeOptimisticOperation so the pending withdraw row keeps its type", () => {
      expect(bridgeApi.describeOptimisticOperation).toBe(describeOptimisticOperation);
    });

    describe("syncsHistoryOnStateChange", () => {
      const configure = (sync?: Record<string, unknown>) =>
        LiveConfig.setConfig({
          config_currency_near: { type: "object", default: { ...(sync ? { sync } : {}) } },
        } as never);

      it("is on by default", () => {
        configure();
        expect(nearBridge.default().syncsHistoryOnStateChange).toBe(true);
      });

      it("is off when the NEAR config sets sync.stateDriven to false, read at each call", () => {
        configure({ stateDriven: false });
        expect(nearBridge.default().syncsHistoryOnStateChange).toBe(false);
        configure({ stateDriven: true });
        expect(nearBridge.default().syncsHistoryOnStateChange).toBe(true);
      });

      it("keeps the module default when the config cannot be read", () => {
        LiveConfig.setConfig({} as never);
        expect(nearBridge.default().syncsHistoryOnStateChange).toBe(true);
      });
    });
  });
});
