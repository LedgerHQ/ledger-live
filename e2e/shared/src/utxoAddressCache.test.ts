import "../__tests__/test-helpers/setup";
import fs from "fs";
import os from "os";
import path from "path";
import { type AddressCacheFile } from "./addressCache";
import { UTXO_ADDRESS_CACHE_FILE, getCachedUtxoAddress } from "./utxoAddressCache";

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

describe("e2e utxoAddressCache", () => {
  describe("getCachedUtxoAddress", () => {
    let dir: string;
    const original = process.env[ENV];

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "utxo-addr-cache-"));
      process.env[ENV] = dir;
      const cache: AddressCacheFile = {
        version: 1,
        addresses: {
          bitcoin: [
            { index: 0, derivationMode: "native_segwit", address: "bc1NS0" },
            { index: 0, derivationMode: "", address: "1Legacy0" },
          ],
          cardano: [{ index: 1, derivationMode: "", address: "addr1CARDANO" }],
          ethereum: [{ index: 0, derivationMode: "", address: "0xShouldNotBeUsed" }],
        },
      };
      fs.writeFileSync(path.join(dir, UTXO_ADDRESS_CACHE_FILE), JSON.stringify(cache));
    });

    afterEach(() => {
      if (original === undefined) delete process.env[ENV];
      else process.env[ENV] = original;
      fs.rmSync(dir, { recursive: true, force: true });
    });

    test("returns the cached address for a UTXO coin", () => {
      expect(getCachedUtxoAddress(account("cardano", 1) as never)).toBe("addr1CARDANO");
    });

    test("disambiguates entries sharing an index by derivationMode", () => {
      expect(getCachedUtxoAddress(account("bitcoin", 0, "native_segwit") as never)).toBe("bc1NS0");
      expect(getCachedUtxoAddress(account("bitcoin", 0, "") as never)).toBe("1Legacy0");
    });

    test("returns null for an account-based coin even when present in the cache", () => {
      expect(getCachedUtxoAddress(account("ethereum", 0) as never)).toBeNull();
    });

    test("returns null on a cache miss (unknown index)", () => {
      expect(getCachedUtxoAddress(account("bitcoin", 99) as never)).toBeNull();
    });

    test("returns null for token sub-accounts (id contains '/')", () => {
      expect(getCachedUtxoAddress(account("ethereum/erc20/usd__coin", 0) as never)).toBeNull();
    });

    test("returns null when the cache is disabled (no env dir)", () => {
      delete process.env[ENV];
      expect(getCachedUtxoAddress(account("cardano", 1) as never)).toBeNull();
    });
  });
});
