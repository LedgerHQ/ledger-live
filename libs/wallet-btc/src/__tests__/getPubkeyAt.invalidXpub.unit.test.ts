import cryptoFactory from "../crypto/factory";
import { decodeXpubOrThrow, XPUB_PAYLOAD_LENGTH } from "../crypto/base";
import { InvalidXpub } from "../errors";
import { DerivationModes } from "../types";

describe("getPubkeyAt — undecodable xpub (LIVE-36601)", () => {
  describe("decodeXpubOrThrow", () => {
    it("decodes a valid xpub", () => {
      const buf = decodeXpubOrThrow(
        "xpub6BtWBf3Pu6hYwJBKvEwG7JtrTxxDrSGy39HaTgZz6GTSaFWFdoCtuEXSQtoKGaYdz1emg8xTXKYwjhu3xXRPzFnYS1z4yjKj7hLDQyNeDZr",
        { network: "bitcoin", account: 0, index: 0 },
      );
      expect(buf.length).toBeGreaterThanOrEqual(XPUB_PAYLOAD_LENGTH);
    });

    it("throws InvalidXpub for a non-base58 string", () => {
      expect(() =>
        decodeXpubOrThrow("xpub0OIl-not-base58-at-all", {
          network: "bitcoin",
          account: 0,
          index: 0,
        }),
      ).toThrow(InvalidXpub);
    });

    it("throws InvalidXpub for a too-short payload", () => {
      expect(() =>
        decodeXpubOrThrow("xpub6Bt", { network: "bitcoin", account: 0, index: 0 }),
      ).toThrow(InvalidXpub);
    });

    it("carries account/index/network context without leaking the raw xpub", () => {
      let caught: unknown;
      try {
        decodeXpubOrThrow("xpub0OIl-not-base58-at-all", {
          network: "bitcoin_testnet",
          account: 1,
          index: 42,
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(InvalidXpub);
      expect(caught).toMatchObject({ network: "bitcoin_testnet", account: 1, index: 42 });
      expect((caught as Error).message).not.toContain("xpub0OIl-not-base58-at-all");
      expect(JSON.stringify(caught)).not.toContain("xpub0OIl-not-base58-at-all");
    });
  });

  describe("Base#getPubkeyAt / getAddress", () => {
    it("rejects with InvalidXpub instead of a raw bs58 error", async () => {
      const bitcoin = cryptoFactory("bitcoin");
      await expect(bitcoin.getPubkeyAt("xpub0OIl-not-base58-at-all", 0, 0)).rejects.toBeInstanceOf(
        InvalidXpub,
      );
    });

    it("rejects with InvalidXpub through native SegWit derivation", async () => {
      const bitcoin = cryptoFactory("bitcoin");
      await expect(
        bitcoin.getAddress(DerivationModes.NATIVE_SEGWIT, "xpub0OIl-not-base58-at-all", 0, 0),
      ).rejects.toBeInstanceOf(InvalidXpub);
    });

    it("still derives a correct address for a valid xpub", async () => {
      const bitcoin = cryptoFactory("bitcoin");
      const address = await bitcoin.getAddress(
        DerivationModes.LEGACY,
        "xpub6BtWBf3Pu6hYwJBKvEwG7JtrTxxDrSGy39HaTgZz6GTSaFWFdoCtuEXSQtoKGaYdz1emg8xTXKYwjhu3xXRPzFnYS1z4yjKj7hLDQyNeDZr",
        0,
        0,
      );
      expect(address).toEqual("1L3fqoWstvLqEA6TgXkuLoXX8xG1xhirG3");
    });
  });
});
