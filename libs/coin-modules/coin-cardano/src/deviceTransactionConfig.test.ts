import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const mockAccount: Account = {
    type: "Account",
    xpub: "xpub",
    index: 0,
    currency: {
      id: "cardano",
      family: "cardano",
      units: [{ code: "ADA", magnitude: 6 }],
    },
    cardanoResources: {
      protocolParams: {
        utxoCostPerByte: "4310",
      },
    },
  } as any;

  it("should return fields for send transaction with fees", async () => {
    const result = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: null,
      transaction: {
        mode: "send",
        amount: new BigNumber(1000000),
        fees: new BigNumber(170000),
        recipient: "addr_test1qz",
      } as any,
      status: {} as any,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "text", label: "Transaction Fee" })]),
    );
  });

  describe("vote delegate transaction", () => {
    it("should return fields for vote delegate transaction with abstain", async () => {
      const result = await getDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: {
          mode: "voteDelegate",
          dRepAbstain: true,
        } as any,
        status: {} as any,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "text", label: "Staking key" }),
          expect.objectContaining({
            type: "text",
            label: "DRep",
            value: "Always abstain",
          }),
        ]),
      );
    });

    it("should return fields for vote delegate transaction with no confidence", async () => {
      const result = await getDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: {
          mode: "voteDelegate",
          dRepNoConfidence: true,
        } as any,
        status: {} as any,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "text", label: "Staking key" }),
          expect.objectContaining({
            type: "text",
            label: "DRep",
            value: "Always no confidence",
          }),
        ]),
      );
    });

    it("should return fields for vote delegate transaction with dRepHex as bech32", async () => {
      const result = await getDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: {
          mode: "voteDelegate",
          dRepHex: "22c8a0059bdc196a48589617c30ceca2b55c0a901975419088348bdcd2",
        } as any,
        status: {} as any,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "text", label: "Staking key" }),
          expect.objectContaining({
            type: "text",
            label: "DRep",
            value: "drep1yty2qpvmmsvk5jzcjctuxr8v5264cz5sr965ryygxj9ae5seg7gah",
          }),
        ]),
      );
    });
  });
});
