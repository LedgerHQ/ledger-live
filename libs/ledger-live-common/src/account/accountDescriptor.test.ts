import { listCryptoCurrencies } from "@domain/entity-currency-crypto";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { DerivationMode } from "@ledgerhq/types-live";
import {
  UnsupportedDescriptorPathError,
  fromLegacyAccount,
  toLegacyAccount,
  type LegacyAccountIdentity,
} from "./accountDescriptor";
import { getDerivationModesForCurrency } from "@ledgerhq/ledger-wallet-framework/derivation";

const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";
const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const account = (
  currencyId: string,
  derivationMode: DerivationMode,
  index: number,
  subject: { xpub: string } | { freshAddress: string },
): LegacyAccountIdentity => ({
  currency: { id: currencyId },
  derivationMode,
  index,
  xpub: undefined,
  freshAddress: "",
  ...subject,
});

describe("fromLegacyAccount", () => {
  it("builds a utxo descriptor with a hardened-only path", () => {
    expect(fromLegacyAccount(account("bitcoin", "native_segwit", 2, { xpub: XPUB }))).toEqual({
      purpose: "account",
      version: "1",
      type: "utxo",
      network: { name: "bitcoin", env: "main" },
      xpub: XPUB,
      path: "m/84h/0h/2h",
    });
  });

  it("builds an address descriptor with the full path", () => {
    expect(fromLegacyAccount(account("ethereum", "", 1, { freshAddress: ETH_ADDR }))).toEqual({
      purpose: "account",
      version: "1",
      type: "address",
      network: { name: "ethereum", env: "main" },
      address: ETH_ADDR,
      path: "m/44h/60h/1h/0/0",
    });
  });

  it("maps a testnet currency to its network env", () => {
    const descriptor = fromLegacyAccount(
      account("bitcoin_testnet", "native_segwit", 0, { xpub: XPUB }),
    );
    expect(descriptor.network).toEqual({ name: "bitcoin", env: "testnet" });
  });
});

describe("fromLegacyAccount classification", () => {
  it("ignores the xpub field of an account-based currency", () => {
    const descriptor = fromLegacyAccount({
      ...account("ethereum", "", 0, { freshAddress: ETH_ADDR }),
      xpub: ETH_ADDR,
    });
    expect(descriptor).toMatchObject({ type: "address", address: ETH_ADDR });
  });
});

describe("fromLegacyAccount validation", () => {
  it("rejects an account without an address", () => {
    expect(() => fromLegacyAccount(account("ethereum", "", 0, { freshAddress: "" }))).toThrow(
      /address/,
    );
  });
});

// these modes have no <account> in their scheme, so only index 0 exists
const SINGLE_ACCOUNT_MODES = new Set<DerivationMode>(["hederaBip44", "solanaMain"]);
// same path as filecoinBIP44, so a descriptor cannot tell them apart
const INDISTINGUISHABLE_MODES = new Set<DerivationMode>(["glif"]);

describe("round trip over every currency and derivation mode", () => {
  it.each(listCryptoCurrencies(true).map(c => c.id))("%s", currencyId => {
    const currency = getCryptoCurrencyById(currencyId);
    const mismatches: string[] = [];
    for (const mode of getDerivationModesForCurrency(currency)) {
      if (INDISTINGUISHABLE_MODES.has(mode)) continue;
      const index = SINGLE_ACCOUNT_MODES.has(mode) ? 0 : 1;
      const subject = currency.family === "bitcoin" ? { xpub: XPUB } : { freshAddress: ETH_ADDR };
      const back = toLegacyAccount(fromLegacyAccount(account(currencyId, mode, index, subject)));
      if (back.derivationMode !== mode || back.index !== index) {
        mismatches.push(`${mode} index ${index} -> ${back.derivationMode} index ${back.index}`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe("toLegacyAccount", () => {
  it("rejects an address descriptor with an incomplete path", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "address",
        network: { name: "ethereum", env: "main" },
        address: ETH_ADDR,
        path: "m/44h/60h/0h",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });

  it("rejects a path that matches no derivation mode", () => {
    expect(() =>
      toLegacyAccount({
        purpose: "account",
        version: "1",
        type: "utxo",
        network: { name: "bitcoin", env: "main" },
        xpub: XPUB,
        path: "m/12h/0h/0h",
      }),
    ).toThrow(UnsupportedDescriptorPathError);
  });
});
