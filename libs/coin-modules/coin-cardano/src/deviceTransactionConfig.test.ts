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
          dRepHex: "2226e524c97bc207362ddcffcba62c6bf5f1ef6c307663e2f2e06a6887",
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
            value: "drep1ymjjfjtmcgrnvtwull96vtrt7hc77mpswe379uhqdf5gwr3mmat",
          }),
        ]),
      );
    });
  });
});
