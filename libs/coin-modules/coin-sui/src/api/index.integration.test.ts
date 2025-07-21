// TODO: re-enable tests once the reverse proxy for SUI is back online

describe("sui api integration test", () => {
  it("is disabled", () => {
    expect(true).toBeTruthy();
  });
});

// import type { AlpacaApi, FeeEstimation, Operation } from "@ledgerhq/coin-framework/api/types";
// import { getEnv } from "@ledgerhq/live-env";
// import { SuiAsset } from "./types";
// import { createApi } from ".";

// describe("Sui Api", () => {
//   let module: AlpacaApi<SuiAsset>;
//   const SENDER = "0xc6dcb5b920f2fdb751b4a8bad800a4ee04257020d8d6e493c8103b760095016e";
//   const RECIPIENT = "0xba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b561";

//   beforeAll(() => {
//     module = createApi({
//       node: {
//         url: getEnv("API_SUI_NODE_PROXY"),
//       },
//     });
//   });

//   describe("estimateFees", () => {
//     it("returns a default value", async () => {
//       // Given
//       const amount = BigInt(100_000);

//       // When
//       const result: FeeEstimation = await module.estimateFees({
//         asset: { type: "native" },
//         type: "send",
//         sender: SENDER,
//         recipient: RECIPIENT,
//         amount: amount,
//       });

//       // Then
//       expect(result.value).toBeGreaterThan(0);
//     });
//   });

//   describe("listOperations", () => {
//     let txs: Operation<SuiAsset>[];

//     beforeAll(async () => {
//       [txs] = await module.listOperations(SENDER, { minHeight: 0 });
//     });

//     it("returns a list regarding address parameter", async () => {
//       expect(txs.length).toBeGreaterThanOrEqual(10);
//       txs.forEach(operation => {
//         const isSenderOrReceipt =
//           operation.senders.includes(SENDER) || operation.recipients.includes(SENDER);
//         expect(isSenderOrReceipt).toBeTruthy();
//       });
//     });

//     it("returns all operations", async () => {
//       expect(txs.length).toBeGreaterThanOrEqual(10);
//       const checkSet = new Set(txs.map(elt => elt.tx.hash));
//       expect(checkSet.size).toBeLessThanOrEqual(txs.length);
//     });

//     it("at least operation should be IN", async () => {
//       expect(txs.length).toBeGreaterThanOrEqual(10);
//       expect(txs.some(t => t.type === "IN")).toBeTruthy();
//     });

//     it("at least operation should be OUT", async () => {
//       expect(txs.length).toBeGreaterThanOrEqual(10);
//       expect(txs.some(t => t.type === "OUT")).toBeTruthy();
//     });

//     it("uses the minHeight to filter", async () => {
//       const minHeightTxs = await module.listOperations(SENDER, { minHeight: 154925948 });
//       expect(txs.length).toBeGreaterThanOrEqual(minHeightTxs.length);
//     });
//   });

//   describe("getBalance", () => {
//     it("returns a list regarding address parameter", async () => {
//       // When
//       const [acc] = await module.getBalance(SENDER);

//       // Then
//       expect(acc.value).toBeGreaterThan(0);
//     });
//   });

//   describe("getLastBlock", () => {
//     it("returns the last block", async () => {
//       // When
//       const result = await module.lastBlock();
//       // Then
//       expect(result.hash).toBeDefined();
//       expect(result.height).toBeDefined();
//       expect(result.time).toBeInstanceOf(Date);
//     });
//   });
// });
