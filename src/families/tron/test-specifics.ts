import sumBy from "lodash/sumBy";
import { syncAccount } from "../../__tests__/test-helpers/bridge";
import dataset from "../../families/tron/test-dataset";
import { getAccountBridge } from "../../bridge";
import type { Account } from "../../types";
import {
  fromAccountRaw,
  decodeAccountId,
  encodeAccountId,
} from "../../account";
import {
  fetchTronAccountTxs,
  getAccountName,
  getBrokerage,
  getTronSuperRepresentativeData,
} from "../../api/Tron";

export default (): void => {
  return; // FIXME LL-7611

  describe("tron super representative data", () => {
    test("max is undefined", async () => {
      const srData = await getTronSuperRepresentativeData(undefined);
      expect(srData.list.length).toBeGreaterThan(27);
      expect(srData.totalVotes).toEqual(sumBy(srData.list, "voteCount"));
      expect(srData.nextVotingDate.getTime()).toBeGreaterThanOrEqual(
        new Date().getTime()
      );
    });
    test("max is set to 27", async () => {
      const srData = await getTronSuperRepresentativeData(27);
      expect(srData.list.length).toEqual(27);
      expect(srData.totalVotes).toBeGreaterThan(
        sumBy(srData.list, "voteCount")
      );
      expect(srData.nextVotingDate.getTime()).toBeGreaterThanOrEqual(
        new Date().getTime()
      );
    });
  });

  describe("get account name", () => {
    test("from a top SR (binance)", async () => {
      const name = await getAccountName("TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH");
      expect(name).toEqual("Binance Staking");
    });
    test("from an account (name is unset)", async () => {
      const name = await getAccountName("TMn5m53QQBhg2VU1acpZpAbcccxUH2eZzr");
      expect(name).toBeUndefined();
    });
  });

  describe("get brokerage", () => {
    test("from a top SR (binance)", async () => {
      const brokerage = await getBrokerage(
        "TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH"
      );
      expect(brokerage).toEqual(20);
    });
  });

  describe("fetch tron txs", () => {
    test("should not contain unsupported custom smart contract tx", async () => {
      const txs = await fetchTronAccountTxs(
        "TPvDn5oQ5uzhDnohWNhQeDu47GJYwxBpqj",
        (txs) => txs.length < 1000,
        {}
      );
      const unsupportedTxIds = [
        "10ea4414383fe49a53253ca1eb497b93bed862106cbe87e479b1320c0e60a8a2",
        "45ba987d98a271d424a2f0043c72c8897d52316d709cb43ff274ca154f210d10",
        "0b2f6c549c47c56f3524478f133bc98f8b4c89962bf3c915ed06ddb5def5ea2a",
        "822f8af2e82aee52276b480e9937e82631cfc9ff2d6ce089c796c24baccaab31", // "80e47e1c203e06363684c007c76defce8f8d55e2f2f7f701ddcde6940c3f2567",
        "ce7c33737d6ad3052a6f25cd6cacb8cc1496c27667ed43c2a5188044191734bf",
      ];
      const hasUnsupportedTxs = txs.filter((tx) =>
        unsupportedTxIds.includes(tx.txID)
      );
      expect(hasUnsupportedTxs).toEqual([]);
    });
  });

  describe("tron accounts", () => {
    const { accounts: accountsRaw = [] } = dataset?.currencies?.tron;
    const { implementations = [] } = dataset;

    const accounts = accountsRaw.reduce((acc, account) => {
      const accountsWithImplem = implementations.map((impl) =>
        fromAccountRaw({
          ...account.raw,
          id: encodeAccountId({
            ...decodeAccountId(account.raw.id),
            type: impl,
          }),
        })
      );

      return acc.concat(accountsWithImplem);
    }, [] as Account[]);

    test.each(accounts)(
      "accounts should always have tronResources",
      async (account) => {
        const bridge = getAccountBridge(account, null);
        const { tronResources = {} } = await syncAccount(bridge, account);

        expect(tronResources).toEqual(
          expect.objectContaining({
            votes: expect.any(Array),
            tronPower: expect.any(Number),
            energy: expect.toBeBigNumber(),
            bandwidth: {
              freeUsed: expect.toBeBigNumber(),
              freeLimit: expect.toBeBigNumber(),
              gainedUsed: expect.toBeBigNumber(),
              gainedLimit: expect.toBeBigNumber(),
            },
            unwithdrawnReward: expect.toBeBigNumber(),
            cacheTransactionInfoById: expect.any(Object),
          })
        );
        expect([
          "bandwidth",
          "cacheTransactionInfoById",
          "delegatedFrozen",
          "energy",
          "frozen",
          "lastVotedDate",
          "lastWithdrawnRewardDate",
          "tronPower",
          "unwithdrawnReward",
          "votes",
        ]).toEqual(expect.arrayContaining(Object.keys(tronResources)));
      }
    );
  });
};
