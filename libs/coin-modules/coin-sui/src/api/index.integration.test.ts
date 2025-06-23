import type { Api, FeeEstimation, Operation } from "@ledgerhq/coin-framework/api/index";
import { createApi } from ".";
import { SuiAsset } from "./types";
import { getEnv } from "@ledgerhq/live-env";

describe("Sui Api", () => {
  let module: Api<SuiAsset>;
  const RECIPIENT = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
  const SENDER = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
  // https://suiscan.xyz/mainnet/account/0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164/activity

  // 5 as of 14/05/2025
  const IN_OPERATIONS_COUNT = 2;
  const OUT_OPERATIONS_COUNT = 3;
  const TOTAL_OPERATIONS_COUNT = IN_OPERATIONS_COUNT + OUT_OPERATIONS_COUNT;

  beforeAll(() => {
    module = createApi({
      status: {
        type: "active",
      },
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
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
      expect(txs.length).toBeGreaterThanOrEqual(2);
      txs.forEach(operation => {
        const isSenderOrReceipt =
          operation.senders.includes(SENDER) || operation.recipients.includes(SENDER);
        expect(isSenderOrReceipt).toBeTruthy();
      });
    });

    it("returns all operations", async () => {
      expect(txs.length).toBeGreaterThanOrEqual(TOTAL_OPERATIONS_COUNT);
      const checkSet = new Set(txs.map(elt => elt.tx.hash));
      expect(checkSet.size).toEqual(txs.length);
    });

    it("at least operation should be IN", async () => {
      expect(txs.filter(t => t.type === "IN").length).toBeGreaterThanOrEqual(IN_OPERATIONS_COUNT);
    });

    it("at least operation should be OUT", async () => {
      expect(txs.filter(t => t.type === "OUT").length).toBeGreaterThanOrEqual(OUT_OPERATIONS_COUNT);
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
