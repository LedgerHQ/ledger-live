import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { GAS_REFUND_WINDOW_MS, isGasRefund } from "./gasRefund";
import { getCurrentNearPreloadData, setNearPreloadData } from "./preload-data";

const ADDRESS = "sender.near";
const NOW = 1_800_000_000_000;
const NEAR = 10n ** 24n;

const operation = (type: string, sender: string, ageMs: number, hash = `h-${ageMs}`): Operation =>
  ({ hash, type, senders: [sender], date: new Date(NOW - ageMs) }) as unknown as Operation;

describe("isGasRefund", () => {
  it("takes a small rise after the account's own recent transaction for its refund", () => {
    const sent = [operation("OUT", ADDRESS, 60_000)];

    expect(isGasRefund(6_770_000_000_000_000_000_000n, sent, ADDRESS, NOW)).toBe(true);
  });

  it("does not take a rise above what the transaction can get back", () => {
    const sent = [operation("OUT", ADDRESS, 60_000)];

    expect(isGasRefund(NEAR, sent, ADDRESS, NOW)).toBe(false);
  });

  it("counts a transaction stored as several rows once", () => {
    // A provisional FEES row and the settled OUT row of one transaction.
    const rows = [
      operation("FEES", ADDRESS, 60_000, "tx"),
      operation("OUT", ADDRESS, 60_000, "tx"),
    ];
    // Above one transaction's 0.3 NEAR bound, below two.
    const rise = (NEAR * 4n) / 10n;

    expect(isGasRefund(rise, rows, ADDRESS, NOW)).toBe(false);
  });

  it("does not take a rise with no recent transaction of the account", () => {
    const old = [operation("OUT", ADDRESS, GAS_REFUND_WINDOW_MS + 1)];
    const received = [operation("IN", "other.near", 60_000)];

    expect(isGasRefund(1n, old, ADDRESS, NOW)).toBe(false);
    expect(isGasRefund(1n, received, ADDRESS, NOW)).toBe(false);
  });

  it("bounds the refund by the gas purchase price preload reports", () => {
    const initial = getCurrentNearPreloadData();
    const sent = [operation("OUT", ADDRESS, 60_000)];
    // 0.2 NEAR: within the bound at 1e9 yocto per gas, above it at half that price.
    const rise = (NEAR * 2n) / 10n;
    try {
      expect(isGasRefund(rise, sent, ADDRESS, NOW)).toBe(true);
      setNearPreloadData({ ...initial, minGasPurchasePrice: new BigNumber(500_000_000) });
      expect(isGasRefund(rise, sent, ADDRESS, NOW)).toBe(false);
    } finally {
      setNearPreloadData(initial);
    }
  });

  it("bounds the refund by the gas price when it is above the purchase floor", () => {
    const initial = getCurrentNearPreloadData();
    const sent = [operation("OUT", ADDRESS, 60_000)];
    // 0.45 NEAR: above the bound at the 1e9 floor, within it at a 2e9 gas price.
    const rise = (NEAR * 45n) / 100n;
    try {
      expect(isGasRefund(rise, sent, ADDRESS, NOW)).toBe(false);
      setNearPreloadData({ ...initial, gasPrice: new BigNumber(2_000_000_000) });
      expect(isGasRefund(rise, sent, ADDRESS, NOW)).toBe(true);
    } finally {
      setNearPreloadData(initial);
    }
  });

  it("does not take a fall for a refund", () => {
    const sent = [operation("OUT", ADDRESS, 60_000)];

    expect(isGasRefund(-1n, sent, ADDRESS, NOW)).toBe(false);
    expect(isGasRefund(0n, sent, ADDRESS, NOW)).toBe(false);
  });
});
