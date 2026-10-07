import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { bchToCashaddrAddressWithoutPrefix, perCoinLogic } from "./logic";

const CASHADDR_P2PKH = "bitcoincash:qqf2sakdcjvh37wx9cdqrx05vjnm30ecr5v9rere8h";
const LEGACY_BCH = "1mW6fDEMjKrDHvLvoEsaeLxSCzZBf3Bfg";
const bitcoinCash = perCoinLogic.bitcoin_cash!;

describe("perCoinLogic", () => {
  it("describes the transaction formats the Ledger apps build", () => {
    expect(perCoinLogic.komodo).toEqual(
      expect.objectContaining({
        hasExtraData: true,
        hasExpiryHeight: true,
        hasInterestLockTime: true,
      }),
    );
    expect(perCoinLogic.decred).toEqual({ hasExpiryHeight: true });
    expect(perCoinLogic.zencash).toEqual({ hasExtraData: true });
    expect(perCoinLogic.komodo!.getAdditionals!({ transaction: {} as Transaction })).toEqual([
      "sapling",
    ]);
    expect(perCoinLogic.bitcoin_gold!.getAdditionals!({ transaction: {} as Transaction })).toEqual([
      "bip143",
    ]);
  });

  it("flags a cashaddr recipient for bitcoin cash", () => {
    const additionals = (recipient: string) =>
      bitcoinCash.getAdditionals!({ transaction: { recipient } as Transaction });
    expect(additionals(CASHADDR_P2PKH)).toEqual(["bip143", "cashaddr"]);
    expect(additionals(CASHADDR_P2PKH.slice("bitcoincash:".length))).toEqual([
      "bip143",
      "cashaddr",
    ]);
    expect(additionals(LEGACY_BCH)).toEqual(["bip143"]);
  });

  it("formats bitcoin cash addresses for the transaction, the device screen and sync", () => {
    expect(bitcoinCash.asExplicitTransactionRecipient!(CASHADDR_P2PKH.slice(12))).toBe(
      CASHADDR_P2PKH,
    );
    expect(bitcoinCash.onScreenTransactionRecipient!(CASHADDR_P2PKH)).toBe(
      CASHADDR_P2PKH.slice(12),
    );
    expect(bitcoinCash.onScreenTransactionRecipient!(LEGACY_BCH)).toBe(LEGACY_BCH);
    expect(bitcoinCash.syncReplaceAddress!(CASHADDR_P2PKH)).toBe(CASHADDR_P2PKH.slice(12));
    expect(bchToCashaddrAddressWithoutPrefix("")).toBe("");
    expect(bitcoinCash.injectGetAddressParams!({} as Account)).toEqual({ forceFormat: "cashaddr" });
  });
});
