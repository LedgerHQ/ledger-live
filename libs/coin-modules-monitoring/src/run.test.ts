import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import run from "./run";
import * as bridgeModule from "@ledgerhq/live-common/bridge/impl";
import { makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import BigNumber from "bignumber.js";

describe("Coin Modules Monitoring", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe("run", () => {
    it("produces log entries to be submitted, skipping failures", async () => {
      jest.spyOn(bridgeModule, "getAccountBridgeByFamily").mockReturnValue({
        sync: makeSync({
          getAccountShape: async info => {
            if (info.address === "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S") {
              throw new Error("Unavailable");
            }
            const accountId = encodeAccountId({
              type: "js",
              version: "2",
              currencyId: info.currency.id,
              xpubOrAddress: info.initialAccount?.xpub ?? info.address,
              derivationMode: "",
            });
            const transactionCounts: Record<string, number> = {
              Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp: 500,
              Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv: 0,
            };
            return {
              id: accountId,
              balance: new BigNumber(0),
              operationsCount: transactionCounts[info.address],
            };
          },
        }),
      } as AccountBridge<TransactionCommon>);
      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(3000) // Start scan big
        .mockReturnValueOnce(3000) // Start scan average
        .mockReturnValueOnce(3050) // End scan average
        .mockReturnValueOnce(3000) // Start sync average
        .mockReturnValueOnce(3025) // End sync average
        .mockReturnValueOnce(3000) // Start scan pristine
        .mockReturnValueOnce(3020) // End scan pristine
        .mockReturnValueOnce(3000) // Start sync pristine
        .mockReturnValueOnce(3010); // End sync pristine

      const logs = await run(["solana"]);

      expect(logs).toEqual([
        {
          duration: 50,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "scan",
          accountType: "average",
          transactions: 500,
          accountAddressOrXpub: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
        },
        {
          duration: 25,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "sync",
          accountType: "average",
          transactions: 500,
          accountAddressOrXpub: "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp",
        },
        {
          duration: 20,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "scan",
          accountType: "pristine",
          transactions: 0,
          accountAddressOrXpub: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv",
        },
        {
          duration: 10,
          currencyName: "solana",
          coinModuleName: "solana",
          operationType: "sync",
          accountType: "pristine",
          transactions: 0,
          accountAddressOrXpub: "Hbac8tM3SMbua9ZBqPRbEJ2n3FtikRJc7wFmZzpqbtBv",
        },
      ]);
    });
  });
});
