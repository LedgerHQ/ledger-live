import { setCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import BigNumber from "bignumber.js";

// Mock the network module
jest.mock("./network", () => ({
  getAccount: jest.fn(),
  getAllAccountTransactions: jest.fn(),
  AlgoTransactionType: {
    PAYMENT: "pay",
    ASSET_TRANSFER: "axfer",
  },
}));

import * as network from "./network";
import { AlgoTransactionType } from "./network";
import { getAccountShape, sync } from "./synchronization";

describe("Synchronization", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenById: async (id: string) => {
        switch (id) {
          case "algorand/asa/1":
            return { id, ticker: "USDC" };
          case "algorand/asa/2":
            return { id, ticker: "USDT" };
          case "algorand/asa/12345":
            return { id, ticker: "TEST" };
          default:
            return undefined;
        }
      },
    } as never);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccountShape", () => {
    describe("basic account synchronization", () => {
      it("should return correct account shape for new account", async () => {
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("10000000"),
          pendingRewards: new BigNumber("5000"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([]);

        const result = await getAccountShape(
          {
            address: "ALGO_ADDRESS",
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.id).toBe("js:2:algorand:ALGO_ADDRESS:");
        expect(result.xpub).toBe("ALGO_ADDRESS");
        expect(result.blockHeight).toBe(50000000);
        expect(result.balance.toString()).toBe("10000000");
        expect(result.algorandResources?.rewards.toString()).toBe("5000");
        expect(result.algorandResources?.nbAssets).toBe(0);
      });

      it("should calculate spendable balance correctly", async () => {
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("1000000"), // 1 ALGO
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([]);

        const result = await getAccountShape(
          {
            address: "ALGO_ADDRESS",
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        // 1 ALGO - 0.1 ALGO min balance = 0.9 ALGO
        expect(result.spendableBalance.toString()).toBe("900000");
      });

      it("should account for assets in spendable balance", async () => {
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("1000000"),
          pendingRewards: new BigNumber("0"),
          assets: [
            { assetId: "1", balance: new BigNumber("100") },
            { assetId: "2", balance: new BigNumber("200") },
          ],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([]);

        const result = await getAccountShape(
          {
            address: "ALGO_ADDRESS",
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        // 1 ALGO - 0.1 ALGO base - 0.2 ALGO for 2 assets = 0.7 ALGO
        expect(result.spendableBalance.toString()).toBe("700000");
        expect(result.algorandResources?.nbAssets).toBe(2);
      });
    });

    describe("payment transactions", () => {
      it("should map outgoing payment transaction", async () => {
        const accountAddress = "SENDER_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_123",
            type: AlgoTransactionType.PAYMENT,
            senderAddress: accountAddress,
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("100"),
            recipientRewards: new BigNumber("0"),
            note: "test payment",
            details: {
              amount: new BigNumber("1000000"),
              recipientAddress: "RECIPIENT_ADDRESS",
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations).toHaveLength(1);
        expect(result.operations[0].type).toBe("OUT");
        expect(result.operations[0].senders).toEqual([accountAddress]);
        expect(result.operations[0].recipients).toEqual(["RECIPIENT_ADDRESS"]);
        expect(result.operations[0].extra.memo).toBe("test payment");
        expect(result.operations[0].extra.rewards?.toString()).toBe("100");
      });

      it("should map incoming payment transaction", async () => {
        const accountAddress = "RECIPIENT_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_456",
            type: AlgoTransactionType.PAYMENT,
            senderAddress: "SENDER_ADDRESS",
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("0"),
            recipientRewards: new BigNumber("50"),
            details: {
              amount: new BigNumber("500000"),
              recipientAddress: accountAddress,
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations[0].type).toBe("IN");
        expect(result.operations[0].extra.rewards?.toString()).toBe("50");
      });

      it("should handle payment with close-to address", async () => {
        const accountAddress = "CLOSE_TO_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_CLOSE",
            type: AlgoTransactionType.PAYMENT,
            senderAddress: "SENDER_ADDRESS",
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("0"),
            recipientRewards: new BigNumber("0"),
            closeRewards: new BigNumber("200"),
            details: {
              amount: new BigNumber("100000"),
              recipientAddress: "RECIPIENT_ADDRESS",
              closeAmount: new BigNumber("400000"),
              closeToAddress: accountAddress,
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations[0].type).toBe("IN");
        expect(result.operations[0].recipients).toContain(accountAddress);
      });

      it("should handle self-payment (sender equals recipient)", async () => {
        const accountAddress = "SELF_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_SELF",
            type: AlgoTransactionType.PAYMENT,
            senderAddress: accountAddress,
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("100"),
            recipientRewards: new BigNumber("0"),
            details: {
              amount: new BigNumber("100000"),
              recipientAddress: accountAddress,
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations[0].type).toBe("OUT");
      });
    });

    describe("asset transfer transactions", () => {
      it("should map OPT_IN transaction", async () => {
        const accountAddress = "OPT_IN_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [{ assetId: "12345", balance: new BigNumber("0") }],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_OPTIN",
            type: AlgoTransactionType.ASSET_TRANSFER,
            senderAddress: accountAddress,
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("0"),
            recipientRewards: new BigNumber("0"),
            details: {
              assetAmount: new BigNumber("0"),
              assetId: "12345",
              assetRecipientAddress: accountAddress,
              assetSenderAddress: accountAddress,
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations[0].type).toBe("OPT_IN");
        expect(result.operations[0].extra.assetId).toBe("12345");
      });

      it("should map OPT_OUT transaction", async () => {
        const accountAddress = "OPT_OUT_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_OPTOUT",
            type: AlgoTransactionType.ASSET_TRANSFER,
            senderAddress: accountAddress,
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("0"),
            recipientRewards: new BigNumber("0"),
            details: {
              assetAmount: new BigNumber("100"),
              assetId: "12345",
              assetRecipientAddress: "RECIPIENT_ADDRESS",
              assetCloseToAddress: "CLOSE_TO_ADDRESS",
              assetCloseAmount: new BigNumber("50"),
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations[0].type).toBe("OPT_OUT");
      });

      it("should map FEES type for regular asset transfer from sender", async () => {
        const accountAddress = "SENDER_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [{ assetId: "12345", balance: new BigNumber("500") }],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_ASA",
            type: AlgoTransactionType.ASSET_TRANSFER,
            senderAddress: accountAddress,
            timestamp: "1700000000",
            round: 49999000,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("0"),
            recipientRewards: new BigNumber("0"),
            details: {
              assetAmount: new BigNumber("100"),
              assetId: "12345",
              assetRecipientAddress: "RECIPIENT_ADDRESS",
            },
          },
        ]);

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations[0].type).toBe("FEES");
      });
    });

    describe("token account ordering", () => {
      it("preserves the order of existing token accounts", async () => {
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber(10),
          pendingRewards: new BigNumber(0),
          assets: [
            { assetId: "1", balance: new BigNumber(4) },
            { assetId: "2", balance: new BigNumber(5) },
          ],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([]);

        const result = await getAccountShape(
          {
            address: "address",
            initialAccount: {
              subAccounts: [
                {
                  id: "js:2:algorand:address:+2",
                  type: "TokenAccount",
                  token: { id: "algorand/asa/2", ticker: "USDT" },
                },
                {
                  id: "js:2:algorand:address:+1",
                  type: "TokenAccount",
                  token: { id: "algorand/asa/1", ticker: "USDC" },
                },
              ],
            },
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result).toMatchObject({
          id: "js:2:algorand:address:",
          xpub: "address",
          balance: new BigNumber(10),
          subAccounts: [
            expect.objectContaining({ id: "js:2:algorand:address:+2" }),
            expect.objectContaining({ id: "js:2:algorand:address:+1" }),
          ],
        });
      });

      it("uses the order of input assets if no token accounts exist yet", async () => {
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber(10),
          pendingRewards: new BigNumber(0),
          assets: [
            { assetId: "1", balance: new BigNumber(4) },
            { assetId: "2", balance: new BigNumber(5) },
          ],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([]);

        const result = await getAccountShape(
          {
            address: "address",
            initialAccount: {
              subAccounts: [],
            },
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result).toMatchObject({
          id: "js:2:algorand:address:",
          xpub: "address",
          balance: new BigNumber(10),
          subAccounts: [
            expect.objectContaining({ id: "js:2:algorand:address:+1" }),
            expect.objectContaining({ id: "js:2:algorand:address:+2" }),
          ],
        });
      });
    });

    describe("incremental sync", () => {
      it("should merge new operations with existing ones", async () => {
        const accountAddress = "ALGO_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000100,
          balance: new BigNumber("6000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([
          {
            id: "TX_NEW",
            type: AlgoTransactionType.PAYMENT,
            senderAddress: "OTHER_ADDRESS",
            timestamp: "1700000100",
            round: 50000050,
            fee: new BigNumber("1000"),
            senderRewards: new BigNumber("0"),
            recipientRewards: new BigNumber("0"),
            details: {
              amount: new BigNumber("1000000"),
              recipientAddress: accountAddress,
            },
          },
        ]);

        const existingOperation = {
          id: "op-old",
          hash: "TX_OLD",
          type: "IN",
          blockHeight: 49999000,
          date: new Date("2023-11-01"),
        };

        const result = await getAccountShape(
          {
            address: accountAddress,
            initialAccount: {
              operations: [existingOperation],
              subAccounts: [],
            },
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        expect(result.operations.length).toBeGreaterThanOrEqual(1);
        expect(result.operationsCount).toBe(result.operations.length);
      });

      it("should start sync from last known block height", async () => {
        const accountAddress = "ALGO_ADDRESS";
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000100,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [],
        } as never);
        const getAllAccountTransactionsSpy = jest
          .spyOn(network, "getAllAccountTransactions")
          .mockResolvedValue([]);

        await getAccountShape(
          {
            address: accountAddress,
            initialAccount: {
              operations: [{ blockHeight: 50000000 }],
              subAccounts: [],
            },
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {} as never,
        );

        // Should start from blockHeight + 1
        expect(getAllAccountTransactionsSpy).toHaveBeenCalledWith(accountAddress, 50000001);
      });
    });

    describe("blacklisted tokens", () => {
      it("should exclude blacklisted token accounts", async () => {
        jest.spyOn(network, "getAccount").mockResolvedValue({
          round: 50000000,
          balance: new BigNumber("5000000"),
          pendingRewards: new BigNumber("0"),
          assets: [
            { assetId: "1", balance: new BigNumber("100") },
            { assetId: "2", balance: new BigNumber("200") },
          ],
        } as never);
        jest.spyOn(network, "getAllAccountTransactions").mockResolvedValue([]);

        const result = await getAccountShape(
          {
            address: "ALGO_ADDRESS",
            initialAccount: null,
            currency: { id: "algorand" },
            derivationMode: "",
          } as never,
          {
            blacklistedTokenIds: ["algorand/asa/1"],
          } as never,
        );

        expect(result.subAccounts).toHaveLength(1);
        expect(result.subAccounts?.[0].token.ticker).toBe("USDT");
      });
    });
  });

  describe("sync", () => {
    it("should be a function created by makeSync", () => {
      expect(typeof sync).toBe("function");
    });
  });
});
