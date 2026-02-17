import BigNumber from "bignumber.js";
import expect from "expect";
import coinConfig from "../config";
import fetchTronTxs from "./fixtures/fetchTronAccountTxs.fixture.json";
import {
  craftStandardTransaction,
  defaultFetchParams,
  fetchTronAccount,
  fetchTronAccountTxs,
  fetchTronTxDetail,
  getTronAccountNetwork,
} from ".";

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
          {},
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

  describe("fetchTronTxDetail", () => {
    it("retrieves details for a transaction", async () => {
      const elts =
        await fetchTronTxs.TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre[
          "428XjpfuumKvTadJgnfch1qNene43UrokeHgYu1CauQWzY8x1JTvnfoGTGYrt8M2giksdRcDPRBCQbYPdQHDqfzKJkoYpHJNZtZgNi4UW2RVF4YQ2Dk52RKuFD4utVXCUQjLE425frExMYWyDNNvb4tU3QP9i57WaAManuaFucAZGhq16q5oSXi7CX1NnrToboCQqpgWhUS8KXNi96DmrG9i99tNgxpHKML"
        ].data;
      const txInfo = {};
      for (const { txID } of elts) {
        const result = await fetchTronTxDetail(txID);
        Object.assign(txInfo, { [txID]: result });
      }

      expect(Object.keys(txInfo).length).toEqual(5);
    });
  });
});
