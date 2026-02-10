import { Operation } from "@ledgerhq/coin-framework/api/types";
import coinConfig from "../config";
import { defaultOptions, listOperations, Options } from "./listOperations";

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

  describe("Account TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9 with minHeight", () => {
    // https://tronscan.org/#/address/TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9

    let operations: Operation[];

    const testingAccount = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";

    // there are 2 operations with height >= 40832955
    const options = { ...defaultOptions, minHeight: 40832955 };
    const historySize = 2;
    const txHashAtMinHeight = "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7";

    beforeAll(async () => {
      [operations] = await listOperations(testingAccount, options);
    });

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(operations).toBeInstanceOf(Array);
        expect(operations.length).toBeGreaterThanOrEqual(historySize);
        expect(operations.filter(op => op.tx.block.height < options.minHeight).length).toEqual(0);
        expect(operations).toContainEqual(
          expect.objectContaining({ tx: expect.objectContaining({ hash: txHashAtMinHeight }) }),
        );
      });
    });
  });

  describe("Account TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L withe more than 15k+ txs, with minHeight 0 / order asc / softLimit 2", () => {
    // https://tronscan.org/#/address/TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L

    let operations: Operation[];

    const testingAccount = "TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L";

    const options: Options = { minHeight: 0, order: "asc", softLimit: 2 };
    const oldestNativeTxHash = "ebd45e2bd6a83949971554ff84fd6253bc7c77f7ef38cc9ca98c070feeac30d0";
    const oldestTrc20TxHash = "d9e56dbac3b7bcab20ae72beaaae9634155bbc0855d230fb8fdb9139b3696796";

    beforeAll(async () => {
      [operations] = await listOperations(testingAccount, options);
    });

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(operations).toBeInstanceOf(Array);
        expect(operations.length).toBeLessThanOrEqual(options.softLimit * 2);
        expect(operations.filter(op => op.tx.block.height < options.minHeight).length).toEqual(0);
        expect(operations).toContainEqual(
          expect.objectContaining({ tx: expect.objectContaining({ hash: oldestNativeTxHash }) }),
        );
        expect(operations).toContainEqual(
          expect.objectContaining({ tx: expect.objectContaining({ hash: oldestTrc20TxHash }) }),
        );
        for (let i = 0; i < operations.length - 2; i++) {
          // transactions are sorted by descencing order (newest first)
          // even if we query oldest tx ("asc" order)
          expect(operations[i].tx.block.height).toBeGreaterThanOrEqual(
            operations[i + 1].tx.block.height,
          );
        }
      });
    });
  });

  describe("Account TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L withe more than 15k+ txs, with minHeight / order asc / softLimit 2", () => {
    // https://tronscan.org/#/address/TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L

    let operations: Operation[];

    const testingAccount = "TRRYfGVrzuUvJYRe9UaA8KqxjgVSwU9m6L";

    const options: Options = { minHeight: 52848767, order: "asc", softLimit: 2 };

    // at height 52848767 there is a trc20 tx with hash:
    const oldestTrc20TxHash = "ab4dba763e4f320f4631268c413926e680c58a3d5228b504d79e9d974dcf9c4b";
    // the counterpart native tx height is at 53204348 with tx hash:
    const oldestNativeTxHash = "9d51fb7877a7193af05917dee3aaa5e1e22fcbce36ad0d4593eaca4b8d5d1002";

    beforeAll(async () => {
      [operations] = await listOperations(testingAccount, options);
    });

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(operations).toBeInstanceOf(Array);
        expect(operations.length).toBeLessThanOrEqual(options.softLimit * 2);
        expect(operations.filter(op => op.tx.block.height < options.minHeight).length).toEqual(0);
        expect(operations).toContainEqual(
          expect.objectContaining({ tx: expect.objectContaining({ hash: oldestNativeTxHash }) }),
        );
        expect(operations).toContainEqual(
          expect.objectContaining({ tx: expect.objectContaining({ hash: oldestTrc20TxHash }) }),
        );
        for (let i = 0; i < operations.length - 2; i++) {
          // transactions are sorted by descencing order (newest first)
          // even if we query oldest tx ("asc" order)
          expect(operations[i].tx.block.height).toBeGreaterThanOrEqual(
            operations[i + 1].tx.block.height,
          );
        }
      });
    });
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
      [operations] = await listOperations(testingAccount, defaultOptions);
    });

    describe("List", () => {
      it("should fetch operations successfully", async () => {
        expect(operations).toBeInstanceOf(Array);
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
        expect(operations).toContainEqual(
          expect.objectContaining({
            tx: expect.objectContaining({
              hash: "242591f43c74e45bf4c5c423be2f600c9a53237bde4c793faff5f3120f8745d7",
              fees: 0n,
            }),
          }),
        );
      });

      it("should return TRX fees", async () => {
        // https://tronscan.org/#/transaction/548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201
        // Sends USDT using 0.29975 TRX
        expect(operations).toContainEqual(
          expect.objectContaining({
            tx: expect.objectContaining({
              hash: "548f235c69eaab2aedaddb5b4763303316d02c2ec4d25617cc3c2a26e1b4a201",
              fees: BigInt(0.29975 * magnitudeMultiplier),
            }),
          }),
        );
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
            asset: { type: "native" },
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
            asset: { type: "native" },
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
              type: "trc10",
              assetReference: "1004031",
            },
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
              type: "trc10",
              assetReference: "1002000",
            },
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
              type: "trc20",
              assetReference: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
            },
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
              type: "trc20",
              assetReference: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
            },
          });
        });
      });

      describe("Staking operations", () => {
        it("should return claim reward txs correctly", () => {
          // https://tronscan.org/#/transaction/e37f3da07f6ed4c2b6092afb2f9940702b2f675d6111c0886341578fd8b81b11
          // Claimed 0.137718 TRX
          expect(operations).toContainEqual(
            expect.objectContaining({
              id: "e37f3da07f6ed4c2b6092afb2f9940702b2f675d6111c0886341578fd8b81b11",
              type: "UNKNOWN",
              value: BigInt(0.137718 * magnitudeMultiplier),
              tx: expect.objectContaining({
                block: expect.objectContaining({ height: 40803577 }),
                fees: 0n,
              }),
              senders: expect.arrayContaining([testingAccount]),
            }),
          );
        });

        it("should return vote txs correctly", () => {
          // https://tronscan.org/#/transaction/9e21ee1c13ba497ed7341d5ba5b97613998a9635530c58779f8d5190e428a1e5
          // Voted for 3 SRs with 18 votes
          expect(operations).toContainEqual(
            expect.objectContaining({
              id: "9e21ee1c13ba497ed7341d5ba5b97613998a9635530c58779f8d5190e428a1e5",
              type: "UNKNOWN",
            }),
          );
        });
      });
    });
  });
});
