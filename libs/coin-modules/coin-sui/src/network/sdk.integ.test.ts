import { getEnv } from "@ledgerhq/live-env";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import {
  createTransaction,
  DEFAULT_COIN_TYPE,
  getAccountBalances,
  getOperations,
  getCheckpoint,
  paymentInfo,
  getBlock,
  getBlockInfo,
  getStakes,
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
          expect(operations).toBeInstanceOf(Array);
        });

        it("should fetch all operations", async () => {
          expect(operations.length).toBeGreaterThanOrEqual(TOTAL_OPERATIONS_COUNT);
        });

        it("should return the first operation at index 0 and the last at the end", async () => {
          const oldestTxHash = "rkTA5Tn9dgrWPnHgj2WK7rVnk5t9jC3ViPcHU9dewDg";
          const newestTxHash = "2GjCnxe8wRqzG4Nr1pad6QAZzCxP8qJY4ioAaVaHvhF7";
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
      const { unsigned: tx } = await createTransaction(address, transaction);
      expect(tx).toBeInstanceOf(Uint8Array);
    });
  });

  describe("paymentInfo", () => {
    test("paymentInfo should return gas budget and fees", async () => {
      const sender = "0xad79719ac7edb44f6e253f1f771e8291e281a6aaf1e4789b52bf85336f525e8e";
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

  describe("getCheckpoint", () => {
    test("getCheckpoint", async () => {
      const checkpointById = await getCheckpoint("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      const checkpointBySequenceNumber = await getCheckpoint("164167623");
      expect(checkpointById.epoch).toEqual("814");
      expect(checkpointById.sequenceNumber).toEqual("164167623");
      expect(checkpointById.timestampMs).toEqual("1751696298663");
      expect(checkpointById.digest).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(checkpointById.previousDigest).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(checkpointById.transactions.length).toEqual(19);
      expect(checkpointById.digest).toEqual(checkpointBySequenceNumber.digest);
    });
  });

  describe("getBlockInfo", () => {
    test("getBlockInfo should get block info by id or sequence number", async () => {
      const blockById = await getBlockInfo("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      const blockBySequenceNumber = await getBlockInfo("164167623");
      expect(blockById.height).toEqual(164167623);
      expect(blockById.hash).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(blockById.time).toEqual(new Date(1751696298663));
      expect(blockById.parent?.height).toEqual(164167622);
      expect(blockById.parent?.hash).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(blockById).toEqual(blockBySequenceNumber);
    });
  });

  describe("getBlock", () => {
    test("getBlock should get block by id or sequence number", async () => {
      const blockById = await getBlock("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      const blockBySequenceNumber = await getBlock("164167623");
      expect(blockById.info.height).toEqual(164167623);
      expect(blockById.info.hash).toEqual("3Q4zW4ieWnNgKLEq6kvVfP35PX2tBDUJERTWYyyz4eyS");
      expect(blockById.info.time).toEqual(new Date(1751696298663));
      expect(blockById.info.parent?.height).toEqual(164167622);
      expect(blockById.info.parent?.hash).toEqual("6VKtVnpxstb968SzSrgYJ7zy5LXgFB6PnNHSJsT8Wr4E");
      expect(blockById.transactions.length).toEqual(19);
      expect(blockById).toEqual(blockBySequenceNumber);
    });
  });

  describe("getStakes", () => {
    test("Account 0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d", async () => {
      const stakes = await getStakes(
        "0x3d9fb148e35ef4d74fcfc36995da14fc504b885d5f2bfeca37d6ea2cc044a32d",
      );
      expect(stakes.length).toBeGreaterThan(0);
      stakes.forEach(stake => {
        expect(stake.uid).toMatch(/0x[0-9a-z]+/);
        expect(stake.address).toMatch(/0x[0-9a-z]+/);
        expect(stake.delegate).toMatch(/0x[0-9a-z]+/);
        expect(stake.state).toMatch(/(activating|active|inactive)/);
        expect(stake.asset).toEqual({ type: "native" });
        expect(stake.amount).toBeGreaterThan(0);
        expect(stake.amountDeposited).toBeGreaterThan(0);
        expect(stake.amountRewarded).toBeGreaterThanOrEqual(0);
        // @ts-expect-error properties are defined
        expect(stake.amount).toEqual(stake.amountDeposited + stake.amountRewarded);
        expect(stake.details).toMatchObject({
          activeEpoch: expect.any(Number),
          requestEpoch: expect.any(Number),
        });
      });
    });
  });
});
