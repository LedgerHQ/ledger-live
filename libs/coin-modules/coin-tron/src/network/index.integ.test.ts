import { fetchTronAccount, fetchTronAccountTxs, fetchTronTxDetail, getAccount, getTronAccountNetwork } from ".";
import coinConfig from "../config";
import fetchTronTxs from "./fixtures/fetchTronAccountTxs.fixture.json";

describe("TronGrid", () => {
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
        // const addr = "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre";
        // const addr = "TAVrrARNdnjHgCGMQYeQV7hv4PSu7mVsMj";
        // const addr = "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi";
        // const addr = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
        // const addr = "TUxd6v64YTWkfpFpNDdtgc5Ps4SfGxwizT";
        const addr = "TY2ksFgpvb82TgGPwUSa7iseqPW5weYQyh";
        const results = await fetchTronAccountTxs(addr, txs => txs.length < 100, {});

        // THEN
        expect(results).not.toHaveLength(0);
      },
      10 * 1000,
    );
  });

  describe("fetchTronAccount", () => {
    it("works", async () => {
      // const result = await fetchTronAccount("TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9");
      const result = await fetchTronAccount("TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre");

      expect(result).toBeUndefined();
    });
  });

  describe("getAccount", () => {
    it("works", async () => {
      const result = await getAccount("TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9");

      expect(result).toBeUndefined();
    });
  });

  describe("getTronAccountNetwork", () => {
    it("works", async () => {
      const result = await getTronAccountNetwork("41ae18eb0a9e067f8884058470ed187f44135d816d");

      expect(result).toBeUndefined();
    });
  });

  describe.only("fetchTronTxDetail", () => {
    it("works", async () => {
      const elts =
        await fetchTronTxs.TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre[
          "428XjpfuumKvTadJgnfch1qNene43UrokeHgYu1CauQWzY8x1JTvnfoGTGYrt8M2giksdRcDPRBCQbYPdQHDqfzKJkoYpHJNZtZgNi4UW2RVF4YQ2Dk52RKuFD4utVXCUQjLE425frExMYWyDNNvb4tU3QP9i57WaAManuaFucAZGhq16q5oSXi7CX1NnrToboCQqpgWhUS8KXNi96DmrG9i99tNgxpHKML"
        ].data; //.slice(80, 100);
      const txInfo = {};
      for (const { txID } of elts) {
        const result = await fetchTronTxDetail(txID);
        Object.assign(txInfo, { [txID]: result });
      }

      console.log(JSON.stringify(txInfo));
    });
  });
});
