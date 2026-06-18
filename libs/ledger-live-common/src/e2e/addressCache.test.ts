import "../__tests__/test-helpers/setup";
import fs from "fs";
import os from "os";
import path from "path";
import {
  ADDRESS_CACHE_FILE,
  getCachedAddress,
  isUtxoBasedCurrency,
  setCachedAddressEntry,
  type AddressCacheFile,
} from "./addressCache";

type FakeAccount = {
  currency: { id: string };
  index: number;
  derivationMode?: string;
};

const account = (id: string, index = 0, derivationMode?: string): FakeAccount => ({
  currency: { id },
  index,
  derivationMode,
});

const ENV = "E2E_GENERATED_ADDRESSES_DIR";

describe("e2e addressCache", () => {
  describe("isUtxoBasedCurrency", () => {
    test.each(["bitcoin", "bitcoin_testnet", "bitcoin_cash", "dogecoin", "litecoin", "zcash"])(
      "bitcoin-family %s is UTXO",
      id => expect(isUtxoBasedCurrency(id)).toBe(true),
    );

    test("cardano (eUTXO) and kaspa are UTXO", () => {
      expect(isUtxoBasedCurrency("cardano")).toBe(true);
      expect(isUtxoBasedCurrency("kaspa")).toBe(true);
    });

    test.each(["ethereum", "solana", "ripple", "polkadot", "tron"])(
      "account-based %s is not UTXO",
      id => expect(isUtxoBasedCurrency(id)).toBe(false),
    );

    test("unknown currency id is not UTXO", () => {
      expect(isUtxoBasedCurrency("not_a_currency")).toBe(false);
    });
  });

  describe("getCachedAddress", () => {
    let dir: string;
    const original = process.env[ENV];

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "addr-cache-"));
      process.env[ENV] = dir;
      const cache: AddressCacheFile = {
        version: 1,
        addresses: {
          ethereum: [{ index: 0, derivationMode: "", address: "0xETH0" }],
          solana: [{ index: 1, derivationMode: "", address: "SOL1" }],
          // present but must never be served (UTXO is always derived live)
          bitcoin: [{ index: 0, derivationMode: "", address: "btcShouldNotBeUsed" }],
        },
      };
      fs.writeFileSync(path.join(dir, ADDRESS_CACHE_FILE), JSON.stringify(cache));
    });

    afterEach(() => {
      if (original === undefined) delete process.env[ENV];
      else process.env[ENV] = original;
      fs.rmSync(dir, { recursive: true, force: true });
    });

    test("returns the cached address for an account-based coin", () => {
      expect(getCachedAddress(account("ethereum", 0) as never)).toBe("0xETH0");
      expect(getCachedAddress(account("solana", 1) as never)).toBe("SOL1");
    });

    test("returns null for a UTXO coin even when present in the cache", () => {
      expect(getCachedAddress(account("bitcoin", 0) as never)).toBeNull();
    });

    test("returns null on a cache miss (unknown index)", () => {
      expect(getCachedAddress(account("ethereum", 99) as never)).toBeNull();
    });

    test("returns null for token sub-accounts (id contains '/')", () => {
      expect(getCachedAddress(account("ethereum/erc20/usd__coin", 0) as never)).toBeNull();
    });

    test("returns null when the cache is disabled (no env dir)", () => {
      delete process.env[ENV];
      expect(getCachedAddress(account("ethereum", 0) as never)).toBeNull();
    });
  });

  describe("setCachedAddressEntry", () => {
    test("inserts then replaces in place on the same (index, derivationMode)", () => {
      const cache: AddressCacheFile = { version: 1, addresses: {} };
      setCachedAddressEntry(cache, "ethereum", { index: 0, derivationMode: "", address: "A" });
      setCachedAddressEntry(cache, "ethereum", { index: 1, derivationMode: "", address: "B" });
      expect(cache.addresses.ethereum).toHaveLength(2);

      setCachedAddressEntry(cache, "ethereum", { index: 0, derivationMode: "", address: "A2" });
      expect(cache.addresses.ethereum).toHaveLength(2);
      expect(cache.addresses.ethereum.find(e => e.index === 0)?.address).toBe("A2");
    });
  });
});
