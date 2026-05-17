import getDeviceTransactionConfig from "./deviceTransactionConfig";
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";

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
          expect.objectContaining({ type: "text", label: "DRep", value: "Abstain" }),
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
          expect.objectContaining({ type: "text", label: "DRep", value: "No Confidence" }),
        ]),
      );
    });

    it("should return fields for vote delegate transaction with dRepHex", async () => {
      const result = await getDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: {
          mode: "voteDelegate",
          dRepHex: "drep123",
        } as any,
        status: {} as any,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "text", label: "Staking key" }),
          expect.objectContaining({ type: "text", label: "DRep", value: "drep123" }),
        ]),
      );
    });
  });
});
