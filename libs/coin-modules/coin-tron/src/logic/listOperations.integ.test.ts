import { listOperations } from "./listOperations";
import coinConfig from "../config";
import { Operation } from "@ledgerhq/coin-framework/api/types";
import { TronToken } from "../types";

describe("listOperations", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  // We could create a loop on array of account addresses and use standard test cases, but this way it's more readable / flexible
  describe("Account TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9", () => {
    // https://tronscan.org/#/address/TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9

    // 255 as of 17/02/2025
    const historySize = 255;

    let operations: Operation<TronToken>[];

    const testingAccount = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";

    const magnitudeMultiplier = 1000000;

    beforeAll(async () => {
      [operations] = await listOperations(testingAccount);
    });

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(Array.isArray(operations)).toBeDefined();
      });

      it("should fetch all operations", async () => {
        // valid because for now 1 tx = 1 operation
        expect(operations.length).toBeGreaterThanOrEqual(historySize);
      });

      it("should return the first operation at index 0 and the last at the end", async () => {
        const oldestTxHash = "a5eb9e9027b2d107a9f290b9f127f52660283ecc644d22ac6fed0b60991f8910";
        const newestTxHash = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";
        expect(operations[operations.length - historySize].tx.hash).toEqual(newestTxHash);
        expect(operations[operations.length - 1].tx.hash).toEqual(oldestTxHash);
      });

      it("should return operations in the right order", async () => {
        for (let i = 0; i < operations.length - 2; i++) {
          expect(operations[i].tx.block.height).toBeGreaterThanOrEqual(
            operations[i + 1].tx.block.height,
          );
        }
      });
    });

    describe("Fees", () => {
      it("should return 0 fees when only bandwidth is used", async () => {
        // https://tronscan.org/#/transaction/242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7
        // Sends LOVE using bandwidth only
        const txHash = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";
        const operation = operations.find(op => op.tx.hash === txHash);
        expect(operation).toBeDefined();
        expect(operation!.tx.fees).toEqual(BigInt(0));
      });

      it("should return TRX fees", async () => {
        // https://tronscan.org/#/transaction/548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201
        // Sends USDT using 0.29975 TRX
        const txHash = "548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201";
        const operation = operations.find(op => op.tx.hash === txHash);
        expect(operation).toBeDefined();
        expect(operation!.tx.fees).toEqual(BigInt(0.29975 * magnitudeMultiplier));
      });
    });

    describe("Transaction types", () => {
      it("should return correct IN/OUT operations numbers", async () => {
        const inOps = operations.filter(op => op.type === "IN");
        const outOps = operations.filter(op => op.type === "OUT");
        expect(inOps.length).toBeGreaterThanOrEqual(126);
        expect(outOps.length).toBeGreaterThanOrEqual(72);
      });

      describe("TRX operations", () => {
        it("should return TRX IN operations correctly", () => {
          // https://tronscan.org/#/transaction/f1feb1de60257bbee7ead864bce24d56a85986130d28e46040acfb6dce48f714
          // Get 0.012 TRX from THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi
          const txHash = "f1feb1de60257bbee7ead864bce24d56a85986130d28e46040acfb6dce48f714";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toMatchObject({
            type: "IN",
            value: BigInt(0.012 * magnitudeMultiplier),
            recipients: [testingAccount],
            senders: ["THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi"],
            asset: undefined,
            operationIndex: 0,
          });
        });

        it("should return TRX OUT operations correctly", () => {
          // https://tronscan.org/#/transaction/7aa4e072e4846e99728e4852852be017ad5bbb4c1f9935ba7d266a88533992be
          // Send 0.1 TRX to TASbVCzbnwu8swZEGFBAH88Z4AwTTBt1PW
          const txHash = "7aa4e072e4846e99728e4852852be017ad5bbb4c1f9935ba7d266a88533992be";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toMatchObject({
            type: "OUT",
            value: BigInt(0.1 * magnitudeMultiplier),
            senders: [testingAccount],
            recipients: ["TASbVCzbnwu8swZEGFBAH88Z4AwTTBt1PW"],
            asset: undefined,
            operationIndex: 0,
          });
        });
      });

      describe("TRC10 operations", () => {
        it("should return TRC10 IN operations correctly", () => {
          // https://tronscan.org/#/transaction/242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7
          // Sends 5.911874 LOVE from TWBEcQ57vbFSEhrQCvsHLDuSb39wprpsEX to TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9
          const txHash = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toMatchObject({
            type: "IN",
            value: BigInt(5.911874 * magnitudeMultiplier),
            recipients: [testingAccount],
            senders: ["TWBEcQ57vbFSEhrQCvsHLDuSb39wprpsEX"],
            asset: {
              standard: "trc10",
              tokenId: "1004031",
            },
            operationIndex: 0,
          });
        });

        it("should return TRC10 OUT operations correctly", () => {
          // https://tronscan.org/#/transaction/aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35
          const txHash = "aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toMatchObject({
            type: "OUT",
            value: BigInt(1 * magnitudeMultiplier),
            senders: [testingAccount],
            recipients: ["TVKG4gUar24bpAVrDv4GSzyDRtPkjPkogL"],
            asset: {
              standard: "trc10",
              tokenId: "1002000",
            },
            operationIndex: 0,
          });
        });
      });

      describe("TRC20 operations", () => {
        it("should return TRC20 IN operations correctly", () => {
          // https://tronscan.org/#/transaction/548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201
          // Receive 0.000376 USDT from TUgU8FRUFSUfxTAoSPsaUBzJgSwpUuJs9N
          const txHash = "548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toMatchObject({
            type: "IN",
            value: BigInt(0.000376 * magnitudeMultiplier),
            senders: ["TUgU8FRUFSUfxTAoSPsaUBzJgSwpUuJs9N"],
            recipients: [testingAccount],
            asset: {
              standard: "trc20",
              contractAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
            },
            operationIndex: 0,
          });
        });

        it("should return TRC20 OUT operations correctly", () => {
          // https://tronscan.org/#/transaction/c0d12c09cf82ddc3d095b1542f017f1093d76266236ea39a72968ab00e4cb976
          // Send 0.1 WINkLink to TLAhq1ds7UR339t48TpzYcJWtfGnXk1KzX
          const txHash = "c0d12c09cf82ddc3d095b1542f017f1093d76266236ea39a72968ab00e4cb976";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toMatchObject({
            type: "OUT",
            value: BigInt(0.1 * magnitudeMultiplier),
            senders: [testingAccount],
            recipients: ["TLAhq1ds7UR339t48TpzYcJWtfGnXk1KzX"],
            asset: {
              standard: "trc20",
              contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
            },
            operationIndex: 0,
          });
        });
      });

      describe("Staking operations", () => {
        it("should return claim reward txs correctly", () => {
          // https://tronscan.org/#/transaction/e37f3da07f6ed4c2b6092afb2f9940702b2f675d6111c0886341578fd8b81b11
          // Claimed 0.137718 TRX
          const txHash = "e37f3da07f6ed4c2b6092afb2f9940702b2f675d6111c0886341578fd8b81b11";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("UNKNOWN");
          expect(operation!.value).toEqual(BigInt(0.137718 * magnitudeMultiplier));
          expect(operation?.tx.block.height).toEqual(40803577);
          // What is expected here ? senders or recipients ?
          // expect(operation!.recipients.includes(testingAccount)).toEqual(true);
          expect(operation!.senders.includes(testingAccount)).toEqual(true);
          expect(operation!.tx.fees).toEqual(BigInt(0));
          expect(operation!.operationIndex).toEqual(0);
        });

        it("should return vote txs correctly", () => {
          // https://tronscan.org/#/transaction/9e21ee1c13ba497ed7341d5ba5b97613998a9635530c58779f8d5190e428a1e5
          // Voted for 3 SRs with 18 votes
          const txHash = "9e21ee1c13ba497ed7341d5ba5b97613998a9635530c58779f8d5190e428a1e5";
          const operation = operations.find(op => op.tx.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("UNKNOWN");
          expect(operation!.operationIndex).toEqual(0);
        });
      });
    });
  });
});
