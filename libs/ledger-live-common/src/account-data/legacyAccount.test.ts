import { fromLegacyAccount, toLegacyAccount, UnsupportedFamilyError } from "./legacyAccount";
import type { LegacyAccountIdentity } from "./legacyAccount";
import type {
  AccountDescriptor,
  UtxoAccountDescriptor,
  AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";
const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const BTC_LEGACY: LegacyAccountIdentity & { id: string; freshAddress: string } = {
  id: `js:2:bitcoin:${XPUB}:native_segwit`,
  currencyId: "bitcoin",
  freshAddress: "bc1qexample",
  seedIdentifier: XPUB,
  derivationMode: "native_segwit",
  index: 0,
};

const ETH_LEGACY: LegacyAccountIdentity & { id: string; freshAddress: string } = {
  id: `js:2:ethereum:${ETH_ADDR}:ethM`,
  currencyId: "ethereum",
  freshAddress: ETH_ADDR,
  seedIdentifier: ETH_ADDR,
  derivationMode: "ethM",
  index: 0,
};

describe("fromLegacyAccount", () => {
  it("converts bitcoin native_segwit to utxo descriptor", () => {
    const descriptor = fromLegacyAccount(BTC_LEGACY);
    expect(descriptor.type).toBe("utxo");
    expect(descriptor.network).toEqual({ name: "bitcoin", env: "main" });
    expect((descriptor as UtxoAccountDescriptor).xpub).toBe(XPUB);
    // native_segwit → purpose 84
    expect((descriptor as UtxoAccountDescriptor).path).toMatch(/^m\/84h/);
  });

  it("produces a hardened-only path for utxo (no non-hardened suffix)", () => {
    const descriptor = fromLegacyAccount(BTC_LEGACY) as UtxoAccountDescriptor;
    const segments = descriptor.path.replace("m/", "").split("/");
    expect(segments.every(s => s.endsWith("h"))).toBe(true);
  });

  it("converts ethereum ethM to address descriptor", () => {
    const descriptor = fromLegacyAccount(ETH_LEGACY);
    expect(descriptor.type).toBe("address");
    expect(descriptor.network).toEqual({ name: "ethereum", env: "main" });
    expect((descriptor as AddressAccountDescriptor).address).toBe(ETH_ADDR);
    // BIP44 → purpose 44
    expect((descriptor as AddressAccountDescriptor).path).toMatch(/^m\/44h/);
  });

  it("encodes a non-zero account index correctly", () => {
    const descriptor = fromLegacyAccount({ ...BTC_LEGACY, index: 2 }) as UtxoAccountDescriptor;
    expect(descriptor.path).toMatch(/2h$/);
  });

  it("maps bitcoin_testnet currencyId to testnet env", () => {
    const descriptor = fromLegacyAccount({
      ...BTC_LEGACY,
      currencyId: "bitcoin_testnet",
    });
    expect(descriptor.network).toEqual({ name: "bitcoin", env: "testnet" });
  });
});

describe("toLegacyAccount", () => {
  it("converts a utxo bitcoin descriptor back to legacy", () => {
    const btcDescriptor: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/84h/0h/0h",
    };
    const legacy = toLegacyAccount(btcDescriptor);
    expect(legacy.currencyId).toBe("bitcoin");
    expect(legacy.seedIdentifier).toBe(XPUB);
    expect(legacy.derivationMode).toBe("native_segwit");
    expect(legacy.index).toBe(0);
  });

  it("round-trips bitcoin legacy → descriptor → legacy", () => {
    const descriptor = fromLegacyAccount(BTC_LEGACY);
    const legacy = toLegacyAccount(descriptor);
    expect(legacy.currencyId).toBe(BTC_LEGACY.currencyId);
    expect(legacy.seedIdentifier).toBe(BTC_LEGACY.seedIdentifier);
    expect(legacy.derivationMode).toBe(BTC_LEGACY.derivationMode);
    expect(legacy.index).toBe(BTC_LEGACY.index);
  });

  it("round-trips ethereum legacy → descriptor → legacy", () => {
    const descriptor = fromLegacyAccount(ETH_LEGACY);
    const legacy = toLegacyAccount(descriptor);
    expect(legacy.currencyId).toBe(ETH_LEGACY.currencyId);
    expect(legacy.seedIdentifier).toBe(ETH_LEGACY.seedIdentifier);
    expect(legacy.derivationMode).toBe(ETH_LEGACY.derivationMode);
    expect(legacy.index).toBe(ETH_LEGACY.index);
  });

  it("reconstructs the account id correctly", () => {
    const descriptor = fromLegacyAccount(BTC_LEGACY);
    const legacy = toLegacyAccount(descriptor);
    expect(legacy.id).toBe(`js:2:bitcoin:${XPUB}:native_segwit`);
  });

  it("throws UnsupportedFamilyError when no derivation mode matches the path", () => {
    const badDescriptor: AccountDescriptor = {
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/999h/0h/0h",
    };
    expect(() => toLegacyAccount(badDescriptor)).toThrow(UnsupportedFamilyError);
  });
});
