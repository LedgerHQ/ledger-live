import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import stacksBridge, { adaptOperations } from "./api";

const ACCOUNT_ID = "js:2:stacks:pubkey:";
const ADDRESS = "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9";

function operation(overrides: Partial<Operation>): Operation {
  return {
    id: `${ACCOUNT_ID}-0xtx1-OUT`,
    hash: "0xtx1",
    accountId: ACCOUNT_ID,
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(100),
    blockHash: "0xblock",
    blockHeight: 10,
    senders: [ADDRESS],
    recipients: [],
    date: new Date(0),
    extra: {},
    ...overrides,
  };
}

describe("stacks bridge api", () => {
  describe("default export", () => {
    it("opts into the generic staking-positions account shape", () => {
      const bridgeApi = stacksBridge({} as unknown as CryptoCurrency);
      expect(bridgeApi.usesStakingPositions).toBe(true);
    });

    it("adapts synced operations", () => {
      const bridgeApi = stacksBridge({} as unknown as CryptoCurrency);
      expect(bridgeApi.adaptOperations).toBe(adaptOperations);
    });
  });

  describe("adaptOperations", () => {
    it("gives each send-many recipient its own sub-operation id and amount, without the fee", () => {
      const batch = operation({ value: new BigNumber(8100) });
      const first = operation({
        value: new BigNumber(5100),
        recipients: ["SP_FIRST"],
        extra: { internal: true, memo: "hi" },
      });
      const second = operation({
        value: new BigNumber(3100),
        recipients: ["SP_SECOND"],
        extra: { internal: true },
      });

      const [adaptedBatch, adaptedFirst, adaptedSecond] = adaptOperations(ADDRESS, [
        batch,
        first,
        second,
      ]);

      expect(adaptedBatch).toBe(batch);
      expect(adaptedFirst).toMatchObject({
        id: `${ACCOUNT_ID}-0xtx1-OUT-i0`,
        value: new BigNumber(5000),
        recipients: ["SP_FIRST"],
        contract: "send-many",
        extra: { internal: true, memo: "hi" },
      });
      expect(adaptedSecond).toMatchObject({
        id: `${ACCOUNT_ID}-0xtx1-OUT-i1`,
        value: new BigNumber(3000),
        recipients: ["SP_SECOND"],
      });
    });

    it("numbers each transaction's recipients from zero", () => {
      const operations = adaptOperations(ADDRESS, [
        operation({ extra: { internal: true } }),
        operation({ hash: "0xtx2", extra: { internal: true } }),
      ]);

      expect(operations.map(op => op.id)).toEqual([
        `${ACCOUNT_ID}-0xtx1-OUT-i0`,
        `${ACCOUNT_ID}-0xtx2-OUT-i0`,
      ]);
    });

    it("values a failed send-many recipient at zero", () => {
      // A failed transaction's value is its fee alone, so nothing reached the recipient.
      const [adapted] = adaptOperations(ADDRESS, [
        operation({ value: new BigNumber(100), hasFailed: true, extra: { internal: true } }),
      ]);

      expect(adapted.value).toEqual(new BigNumber(0));
    });

    it("leaves every other operation untouched", () => {
      const operations = [
        operation({ type: "IN", value: new BigNumber(500) }),
        operation({ type: "FEES", value: new BigNumber(100) }),
      ];

      expect(adaptOperations(ADDRESS, operations)).toEqual(operations);
    });
  });
});
