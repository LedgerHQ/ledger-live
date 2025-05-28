import type { AlpacaApi, FeeEstimation, Operation } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
import { SuiAsset } from "./types";
import { getFullnodeUrl } from "@mysten/sui/client";

describe("Sui Api", () => {
  let module: AlpacaApi<SuiAsset>;
  const SENDER = "0x67b511de2697e4567e41a4477a3abccd4c7c00f4c59b45ab8c72d1544f58ceb8";
  const RECIPIENT = "0xba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b561";

  beforeAll(() => {
    module = createApi({
      status: {
        type: "active",
      },
      node: {
        url: getFullnodeUrl("mainnet"),
      },
    });
  });

  describe("estimateFees", () => {
    it("returns a default value", async () => {
      // Given
      const amount = BigInt(100_000);

      // When
      const result: FeeEstimation = await module.estimateFees({
        asset: { type: "native" },
        type: "send",
        sender: SENDER,
        recipient: RECIPIENT,
        amount: amount,
      });

      // Then
      expect(result.value).toBeGreaterThan(0);
    });
  });

  describe("listOperations", () => {
    let txs: Operation<SuiAsset>[];

    beforeAll(async () => {
      [txs] = await module.listOperations(SENDER, { minHeight: 0 });
    });

    it("returns a list regarding address parameter", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(SENDER) || operation.recipients.includes(SENDER);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
    });

    it("at least operation should be IN", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      expect(txs.some(t => t.type === "IN")).toBeTruthy();
    });

    it("at least operation should be OUT", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(10);
      expect(txs.some(t => t.type === "OUT")).toBeTruthy();
    });
  });

  describe("getBalance", () => {
    it("returns a list regarding address parameter", async () => {
      // When
      const [acc] = await module.getBalance(SENDER);

      // Then
      expect(acc.value).toBeGreaterThan(0);
    });
  });

  describe("getLastBlock", () => {
    it("returns the last block", async () => {
      // When
      const result = await module.lastBlock();
      // Then
      expect(result.hash).toBeDefined();
      expect(result.height).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
    });
  });
});
