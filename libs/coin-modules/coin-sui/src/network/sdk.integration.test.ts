import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import coinConfig from "../config";
import {
  createTransaction,
  DEFAULT_COIN_TYPE,
  getAccountBalances,
  getOperations,
  paymentInfo,
} from "./sdk";

describe("SUI SDK Integration tests", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getEnv("API_SUI_NODE_PROXY"),
      },
    }));
  });

  describe("getOperations", () => {
    describe("Account 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164", () => {
      // https://suiscan.xyz/mainnet/account/0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164/activity

      // 5 as of 14/05/2025
      const IN_OPERATIONS_COUNT = 2;
      const OUT_OPERATIONS_COUNT = 3;
      const TOTAL_OPERATIONS_COUNT = IN_OPERATIONS_COUNT + OUT_OPERATIONS_COUNT;

      let operations: Operation[];

      const testingAccount = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

      beforeAll(async () => {
        operations = await getOperations("mockAccoundId", testingAccount);
      });

      describe("List", () => {
        it("should fetch operations successfully", async () => {
          expect(Array.isArray(operations)).toBeDefined();
        });

        it("should fetch all operations", async () => {
          expect(operations.length).toBeGreaterThanOrEqual(TOTAL_OPERATIONS_COUNT);
        });

        it("should return the first operation at index 0 and the last at the end", async () => {
          const oldestTxHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
          const newestTxHash = "2jXqsRSZNHZm4uEfpFxJE7A7RoZxWPZeANfBP4qGWkPR";
          expect(operations[operations.length - TOTAL_OPERATIONS_COUNT].hash).toEqual(newestTxHash);
          expect(operations[operations.length - 1].hash).toEqual(oldestTxHash);
        });
      });

      describe("Transaction types", () => {
        it("should return correct IN/OUT operations numbers", async () => {
          const inOps = operations.filter(op => op.type === "IN");
          const outOps = operations.filter(op => op.type === "OUT");
          expect(inOps.length).toBeGreaterThanOrEqual(IN_OPERATIONS_COUNT);
          expect(outOps.length).toBeGreaterThanOrEqual(OUT_OPERATIONS_COUNT);
        });

        describe("SUI operations", () => {
          it("should return SUI IN operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg
            // Send 0.15 SUI to 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "IN",
              value: BigNumber("150000000"),
              senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              recipients: [testingAccount],
              extra: { coinType: "0x2::sui::SUI" },
            });
          });
          it("should return SUI OUT operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW
            // Get 0.052 SUI from 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "CnVCqFLDv9iJc3DPU2WGpJdZUjqFPhyEVJ5BAigEj9VW";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "OUT",
              value: BigNumber("51747880"),
              recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              senders: [testingAccount],
              extra: { coinType: "0x2::sui::SUI" },
            });
          });
        });

        describe("SUI tokens operations", () => {
          it("should return SUI tokens IN operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/B7x8pACzpoFSQ5rmA5T3Q91Q48CroFuerXf62KLaY5TY
            // Send 0.59 USDT to 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "B7x8pACzpoFSQ5rmA5T3Q91Q48CroFuerXf62KLaY5TY";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "IN",
              value: BigNumber("592557"),
              senders: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              recipients: [testingAccount],
              extra: {
                coinType:
                  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
              },
            });
          });
          it("should return SUI tokens OUT operations correctly", () => {
            // https://suiscan.xyz/mainnet/tx/2GjCnxe8wRqzG4Nr1pad6QAZzCxP8qJY4ioAaVaHvhF7
            // Get 0.59 USDT from 0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164
            const txHash = "2GjCnxe8wRqzG4Nr1pad6QAZzCxP8qJY4ioAaVaHvhF7";
            const operation = operations.find(op => op.hash === txHash);
            expect(operation).toMatchObject({
              type: "OUT",
              value: BigNumber("592557"),
              recipients: ["0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0"],
              senders: [testingAccount],
              extra: {
                coinType:
                  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
              },
            });
          });
        });
      });
    });
  });

  describe("getBalance", () => {
    test("getAccountBalances should return account balance", async () => {
      const address = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
      const balance = await getAccountBalances(address);
      expect(balance[0]).toHaveProperty("blockHeight");
      expect(balance[0]).toHaveProperty("balance");
    });
  });

  describe("createTransaction", () => {
    test("createTransaction should build a transaction", async () => {
      const address = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
      const transaction = {
        mode: "send" as const,
        family: "sui" as const,
        coinType: DEFAULT_COIN_TYPE,
        amount: new BigNumber(100),
        recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
        errors: {},
      };
      const tx = await createTransaction(address, transaction);
      expect(tx).toBeInstanceOf(Uint8Array);
    });
  });

  describe("paymentInfo", () => {
    test("paymentInfo should return gas budget and fees", async () => {
      const sender = "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0";
      const fakeTransaction = {
        mode: "send" as const,
        family: "sui" as const,
        coinType: DEFAULT_COIN_TYPE,
        amount: new BigNumber(100),
        recipient: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
        errors: {},
      };
      const info = await paymentInfo(sender, fakeTransaction);
      expect(info).toHaveProperty("gasBudget");
      expect(info).toHaveProperty("totalGasUsed");
      expect(info).toHaveProperty("fees");
    });
  });
});
