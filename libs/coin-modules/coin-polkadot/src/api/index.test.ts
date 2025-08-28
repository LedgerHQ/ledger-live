/* eslint-disable @typescript-eslint/consistent-type-assertions */

import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { createApi } from ".";
import type { PolkadotConfig } from "../config";
import * as logic from "../logic";
import { type GenericExtrinsic, TypeRegistry } from "@polkadot/types";
import type { CoreTransaction } from "../types";
import type { AnyTuple } from "@polkadot/types/types";

function generateApi() {
  const config = {} as PolkadotConfig;
  return createApi(config);
}

describe("index", () => {
  describe("createApi", () => {
    it("should generate an instance of AlpacaApi", () => {
      const api = generateApi();
      expect(api).toEqual({
        broadcast: logic.broadcast,
        combine: expect.any(Function),
        craftTransaction: expect.any(Function),
        estimateFees: expect.any(Function),
        getBalance: logic.getBalance,
        lastBlock: logic.lastBlock,
        listOperations: expect.any(Function),
        getBlock: expect.any(Function),
        getBlockInfo: expect.any(Function),
        getStakes: expect.any(Function),
        getRewards: expect.any(Function),
      });

      expect(() => api.combine("", "")).toThrow("UnsupportedMethod");
      expect(() => api.getBlock(0)).toThrow("getBlock is not supported");
      expect(() => api.getBlockInfo(0)).toThrow("getBlockInfo is not supported");
      expect(() => api.getStakes("")).toThrow("getStakes is not supported");
      expect(() => api.getRewards("")).toThrow("getRewards is not supported");
    });
  });

  describe("craftTransaction", () => {
    it("it should craft a transaction", async () => {
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
      jest.spyOn(logic, "craftTransaction").mockResolvedValue({
        unsigned: {
          version: 0,
        },
        registry,
      } as CoreTransaction);

      const tx = await api.craftTransaction(intent);
      expect(tx).toEqual(extrinsic.toHex());
    });
  });

  describe("estimateFees", () => {
    it("it should estimate fees", async () => {
      const api = generateApi();

      const intent = {
        amount: 456717762531n,
        sender: "12JHbw1vnXxqsD6U5yA3u9Kqvp9A7Zi3qM2rhAreZqP5zUmS",
      } as TransactionIntent;

      const fees = BigInt(1);
      jest.spyOn(logic, "estimateFees").mockResolvedValue(fees);

      jest.spyOn(logic, "craftEstimationTransaction").mockResolvedValue({} as CoreTransaction);

      const feeEstimation = await api.estimateFees(intent);
      expect(feeEstimation.value).toEqual(fees);
    });
  });

  describe("listOperations", () => {
    it("should return operations", async () => {
      const api = generateApi();

      jest.spyOn(logic, "listOperations").mockResolvedValue([[], 2]);
      const result = await api.listOperations("some random address", { minHeight: 0 });
      expect(result).toEqual([[], "2"]);
    });
  });
});
