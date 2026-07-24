import BigNumber from "bignumber.js";
import cryptoFactory from "../crypto/factory";
import { DerivationModes } from "../types";
import { computeDustAmount } from "../utils";

const bitcoin = cryptoFactory("bitcoin"); // dustThreshold 3000, PER_KBYTE
const litecoin = cryptoFactory("litecoin"); // dustThreshold 10000, FIXED

// inputVBytes = vbytesCeilFromWeight(inputWeight(mode)): legacy 148, native segwit 68, taproot 58
describe("computeDustAmount", () => {
  describe("relay-aware (bitcoin, PER_KBYTE)", () => {
    it("uses 3 x inputVBytes x relayFee when above the legacy floor", () => {
      // 3 * 68 * 5 = 1020 > legacy 3 * 100 = 300
      expect(
        computeDustAmount(bitcoin, 100, {
          derivationMode: DerivationModes.NATIVE_SEGWIT,
          relayFeePerByteSatVb: new BigNumber(5),
        }),
      ).toBe(1020);
    });

    it("sizes the input per derivation mode", () => {
      const relayFeePerByteSatVb = new BigNumber(10);
      expect(
        computeDustAmount(bitcoin, 0, {
          derivationMode: DerivationModes.LEGACY,
          relayFeePerByteSatVb,
        }),
      ).toBe(3 * 148 * 10);
      expect(
        computeDustAmount(bitcoin, 0, {
          derivationMode: DerivationModes.TAPROOT,
          relayFeePerByteSatVb,
        }),
      ).toBe(3 * 58 * 10);
    });

    it("rounds the dust up to an integer for a fractional relay fee", () => {
      // 3 * 68 * 0.1 = 20.4 -> 21
      expect(
        computeDustAmount(bitcoin, 0, {
          derivationMode: DerivationModes.NATIVE_SEGWIT,
          relayFeePerByteSatVb: new BigNumber(0.1),
        }),
      ).toBe(21);
    });

    it("never drops below the legacy threshold (low relay fee floor)", () => {
      // 3 * 68 * 1 = 204 < legacy 3 * 400 = 1200
      expect(
        computeDustAmount(bitcoin, 400, {
          derivationMode: DerivationModes.NATIVE_SEGWIT,
          relayFeePerByteSatVb: new BigNumber(1),
        }),
      ).toBe(1200);
    });
  });

  describe("legacy fallback", () => {
    it("falls back when relay fee is missing", () => {
      expect(
        computeDustAmount(bitcoin, 200, { derivationMode: DerivationModes.NATIVE_SEGWIT }),
      ).toBe(600);
    });

    it("falls back when derivation mode is missing", () => {
      expect(computeDustAmount(bitcoin, 200, { relayFeePerByteSatVb: new BigNumber(5) })).toBe(600);
    });

    it("falls back (no throw) when derivation mode is unknown", () => {
      expect(
        computeDustAmount(bitcoin, 200, {
          derivationMode: "Unknown",
          relayFeePerByteSatVb: new BigNumber(5),
        }),
      ).toBe(600);
    });

    it("falls back when relay fee is zero", () => {
      expect(
        computeDustAmount(bitcoin, 200, {
          derivationMode: DerivationModes.NATIVE_SEGWIT,
          relayFeePerByteSatVb: new BigNumber(0),
        }),
      ).toBe(600);
    });

    it("keeps FIXED-policy altcoins unchanged even with a relay fee", () => {
      expect(
        computeDustAmount(litecoin, 200, {
          derivationMode: DerivationModes.NATIVE_SEGWIT,
          relayFeePerByteSatVb: new BigNumber(5),
        }),
      ).toBe(10000);
    });

    it("matches the previous behavior with no opts", () => {
      expect(computeDustAmount(bitcoin, 200)).toBe(600);
      expect(computeDustAmount(litecoin, 200)).toBe(10000);
    });
  });
});
