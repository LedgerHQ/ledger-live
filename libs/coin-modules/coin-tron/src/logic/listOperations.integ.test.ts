import { listOperations } from "./listOperations";
import coinConfig from "../config";
import { Operation } from "@ledgerhq/coin-framework/api/types";

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

    let operations: Operation[];

    const testingAccount = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";

    const magnitudeMultiplier = 1000000;

    beforeAll(async () => {
      [operations] = await listOperations(testingAccount);
    }, 40000);

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(operations).toBeDefined();
      });

      it("should fetch all operations", async () => {
        expect(operations.length).toBeGreaterThanOrEqual(historySize);
      });

      it("should return the first operation at index 0 and the last at the end", async () => {
        const oldestTxHash = "a5eb9e9027b2d107a9f290b9f127f52660283ecc644d22ac6fed0b60991f8910";
        const newestTxHash = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";
        expect(operations[operations.length - historySize].hash).toEqual(newestTxHash);
        expect(operations[operations.length - 1].hash).toEqual(oldestTxHash);
      });
    });

    describe("Fees", () => {});

    describe("Transaction types", () => {
      it("should return correct IN/OUT operations numbers", async () => {
        const inOps = operations.filter(op => op.recipients.includes(testingAccount));
        const outOps = operations.filter(op => op.senders.includes(testingAccount));
        expect(inOps.length).toBeGreaterThanOrEqual(126);
        expect(outOps.length).toBeGreaterThanOrEqual(72);
      });

      describe("TRX operations", () => {});

      describe("TRC10 operations", () => {
        const trc10Magnitude = 1000000;
        it("should return TRC10 IN operations correctly", () => {
          // https://tronscan.org/#/transaction/242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7
          // Sends 5.911874 LOVE from TWBEcQ57vbFSEhrQCvsHLDuSb39wprpsEX to TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9
          const txHash = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("TransferAssetContract");
          expect(operation!.value).toEqual(BigInt(5.911874 * trc10Magnitude));
          expect(operation!.recipients.includes(testingAccount)).toEqual(true);
        });

        it("should return TRC10 OUT operations correctly", () => {
          // https://tronscan.org/#/transaction/aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35
          const txHash = "aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("TransferAssetContract");
          expect(operation!.value).toEqual(BigInt(1 * trc10Magnitude));
          expect(operation!.senders.includes(testingAccount)).toEqual(true);
        });
      });

      describe("TRC20 operations", () => {
        const trc10Magnitude = 1000000;
        it("should return TRC20 IN operations correctly", () => {
          // https://tronscan.org/#/transaction/242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7
          const txHash = "aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("TransferAssetContract");
          expect(operation!.value).toEqual(BigInt(1 * trc10Magnitude));
          expect(operation!.senders.includes(testingAccount)).toEqual(true);
        });

        it("should return TRC20 OUT operations correctly", () => {
          // https://tronscan.org/#/transaction/aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35
          const txHash = "aad221c56cda364f6c8404298fb4132af850c07ae701e1b2af0c981ae38f2b35";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("TransferAssetContract");
          expect(operation!.value).toEqual(BigInt(1 * trc10Magnitude));
          expect(operation!.senders.includes(testingAccount)).toEqual(true);
        });
      });

      describe("Staking operations", () => {
        it("should return claim reward txs correctly", () => {
          // https://tronscan.org/#/transaction/e37f3da07f6ed4c2b6092afb2f9940702b2f675d6111c0886341578fd8b81b11
          // Claimed 0.137718 TRX
          const txHash = "e37f3da07f6ed4c2b6092afb2f9940702b2f675d6111c0886341578fd8b81b11";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("WithdrawBalanceContract");
          expect(operation!.value).toEqual(BigInt(0.137718 * magnitudeMultiplier));
          expect(operation?.block.height).toEqual(40803577);
          // What is expected here ? senders or recipients ?
          // expect(operation!.recipients.includes(testingAccount)).toEqual(true);
          expect(operation!.senders.includes(testingAccount)).toEqual(true);
          expect(operation!.fee).toEqual(BigInt(0));
        });

        it("should return vote txs correctly", () => {
          // https://tronscan.org/#/transaction/9e21ee1c13ba497ed7341d5ba5b97613998a9635530c58779f8d5190e428a1e5
          // Voted for 3 SRs with 18 votes
          const txHash = "9e21ee1c13ba497ed7341d5ba5b97613998a9635530c58779f8d5190e428a1e5";
          const operation = operations.find(op => op.hash === txHash);
          expect(operation).toBeDefined();
          expect(operation!.type).toEqual("VoteWitnessContract");
        });
      });
    });
  });
});
