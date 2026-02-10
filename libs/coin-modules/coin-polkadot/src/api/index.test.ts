/* eslint-disable @typescript-eslint/consistent-type-assertions */

import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { TypeRegistry, type GenericExtrinsic } from "@polkadot/types";
import type { AnyTuple } from "@polkadot/types/types";
import type { PolkadotConfig } from "../config";
import * as logic from "../logic";
import type { CoreTransaction } from "../types";
import { createApi } from ".";

// Module-level mocks for logic functions that need to be spied on
const mockBroadcast = jest.fn();
const mockCraftTransaction = jest.fn();
const mockEstimateFees = jest.fn();
const mockCraftEstimationTransaction = jest.fn();
const mockListOperations = jest.fn();

jest.mock("../logic", () => ({
  ...jest.requireActual("../logic"),
  broadcast: (...args: unknown[]) => mockBroadcast(...args),
  craftTransaction: (...args: unknown[]) => mockCraftTransaction(...args),
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
  craftEstimationTransaction: (...args: unknown[]) => mockCraftEstimationTransaction(...args),
  listOperations: (...args: unknown[]) => mockListOperations(...args),
}));

function generateApi() {
  const config = {} as PolkadotConfig;
  return createApi(config);
}

describe("index", () => {
  describe("createApi", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should generate an instance of AlpacaApi", () => {
      const api = generateApi();
      expect(api).toEqual({
        broadcast: expect.any(Function),
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        craftRawTransaction: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: logic.getBalance,
        getBlock: expect.any(Function),
        getBlockInfo: expect.any(Function),
        getRewards: expect.any(Function),
        getStakes: expect.any(Function),
        getValidators: expect.any(Function),
        lastBlock: logic.lastBlock,
        listOperations: expect.any(Function),
      });
    });
  });

  describe("combine", () => {
    it.each([undefined, ""])("should throw an error when pubkey is %s", pubkey => {
      const api = generateApi();
      expect(() => api.combine("", "", pubkey)).toThrow("UnsupportedMethod");
    });
  });

  describe("craftRawTransaction", () => {
    it("should throw an error when pubkey is %s", () => {
      const api = generateApi();
      expect(() => api.craftRawTransaction("", "", "", BigInt(0))).toThrow(
        "craftRawTransaction is not supported",
      );
    });
  });

  describe("getBlock", () => {
    it("should throw an error", () => {
      const api = generateApi();
      expect(() => api.getBlock(0)).toThrow("getBlock is not supported");
    });
  });

  describe("getBlockInfo", () => {
    it("should throw an error", () => {
      const api = generateApi();
      expect(() => api.getBlockInfo(0)).toThrow("getBlockInfo is not supported");
    });
  });

  describe("getRewards", () => {
    it.each([undefined, ""])("should throw an error when cursor is %s", cursor => {
      const api = generateApi();
      expect(() => api.getRewards("", cursor)).toThrow("getRewards is not supported");
    });
  });

  describe("getStakes", () => {
    it.each([undefined, ""])("should throw an error when cursor is %s", cursor => {
      const api = generateApi();
      expect(() => api.getStakes("", cursor)).toThrow("getStakes is not supported");
    });
  });

  describe("getValidators", () => {
    it.each([undefined, ""])("should throw an error when cursor is %s", cursor => {
      const api = generateApi();
      expect(() => api.getValidators(cursor)).toThrow("getValidators is not supported");
    });
  });

  describe("broadcast", () => {
    it("should broadcast a transaction using broadcast from logic", async () => {
      const api = generateApi();

      mockBroadcast.mockResolvedValueOnce("");

      const transaction = "some random string";
      await api.broadcast(transaction);

      expect(mockBroadcast).toHaveBeenCalledTimes(1);
      expect(mockBroadcast).toHaveBeenCalledWith(transaction, "polkadot");
    });
  });

  describe("craftTransaction", () => {
    it("should craft a transaction", async () => {
      const api = generateApi();

      const intent = {
        amount: 456717762531n,
        recipient: "12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS",
      } as TransactionIntent;

      const extrinsic = {
        toHex: () => "0x1234",
      } as unknown as GenericExtrinsic<AnyTuple>;

      const registry = new TypeRegistry();
      jest.spyOn(registry, "createType").mockReturnValue(extrinsic);
      mockCraftTransaction.mockResolvedValue({
        unsigned: {
          version: 0,
        },
        registry,
      } as CoreTransaction);

      const tx = await api.craftTransaction(intent);
      expect(tx).toEqual({ transaction: extrinsic.toHex() });
    });
  });

  describe("estimateFees", () => {
    it("should estimate fees", async () => {
      const api = generateApi();

      const intent = {
        amount: 456717762531n,
        sender: "12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS",
      } as TransactionIntent;

      const fees = 1n;
      mockEstimateFees.mockResolvedValue(fees);

      mockCraftEstimationTransaction.mockResolvedValue({} as CoreTransaction);

      const feeEstimation = await api.estimateFees(intent);
      expect(feeEstimation.value).toEqual(fees);
    });
  });

  describe("listOperations", () => {
    it("should return operations", async () => {
      const api = generateApi();

      mockListOperations.mockResolvedValue([[], 2]);
      const result = await api.listOperations("some random address", { minHeight: 0 });
      expect(result).toEqual([[], "2"]);
    });
  });
});
