import BigNumber from "bignumber.js";
import coinConfig from "../config";
import {
  craftStandardTransaction,
  defaultFetchParams,
  fetchTronAccount,
  fetchTronAccountTxs,
  getChainParameters,
  getTronAccountNetwork,
  triggerConstantContract,
} from ".";
import { decode58Check } from "./format";
import { abiEncodeTrc20Transfer } from "./utils";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

/**
 * Tests used to help to develop and debug. Can't be reliable for the CI.
 */
describe("TronGrid", () => {
  const address = "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh";

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

  describe("fetchTronAccountTxs", () => {
    it(
      "maps all fields correctly",
      async () => {
        // WHEN
        const results = await fetchTronAccountTxs(
          address,
          txs => txs.length < 100,
          defaultFetchParams,
        );

        // THEN
        expect(results).not.toHaveLength(0);
      },
      10 * 1000,
    );
  });

  describe("fetchTronAccount", () => {
    it("retrieves exactly one element", async () => {
      const result = await fetchTronAccount(address);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("balance");
    });
  });

  describe("craftStandardTransaction", () => {
    it("handles errors correctly", async () => {
      await expect(
        craftStandardTransaction(
          "wrong token address",
          "wrong recipient address",
          "wrong sender address",
          BigNumber(-1),
          false,
          "wrong memo",
          -1,
        ),
      ).rejects.toThrow("INVALID hex String");
    });
  });

  describe("getTronAccountNetwork", () => {
    it("works", async () => {
      const result = await getTronAccountNetwork(address);

      expect(result.family).toEqual("tron");
      for (const p of [
        "freeNetUsed",
        "freeNetLimit",
        "netUsed",
        "netLimit",
        "energyUsed",
        "energyLimit",
      ]) {
        expect(result).toHaveProperty(p);
      }
    });
  });

  describe("getChainParameters", () => {
    beforeEach(() => {
      getChainParameters.reset();
    });

    it("returns the four parameters used by fee estimation with mainnet values", async () => {
      const params = await getChainParameters();

      expect(params.transactionFee).toBe(1000);
      expect(params.createAccountFee).toBe(100_000);
      expect(params.createNewAccountFeeInSystemContract).toBe(1_000_000);
      // gov-voted; historical values 100, 280, 420 sun/energy.
      expect(params.energyFee).toBeGreaterThanOrEqual(50);
      expect(params.energyFee).toBeLessThanOrEqual(500);
    });
  });

  describe("triggerConstantContract", () => {
    it("returns energy_used within the documented USDT transfer range", async () => {
      const response = await triggerConstantContract({
        ownerAddress: decode58Check(address),
        contractAddress: decode58Check(USDT_CONTRACT),
        functionSelector: "transfer(address,uint256)",
        parameter: abiEncodeTrc20Transfer(decode58Check(address), new BigNumber(1)),
      });

      // Revert overhead ~5k; transfer to existing holder ~14k; to brand-new ~65k.
      expect(response.energy_used).toBeGreaterThanOrEqual(5_000);
      expect(response.energy_used).toBeLessThanOrEqual(100_000);
    });
  });
});
