import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { DerivationMode } from "@ledgerhq/types-live";
import { fromLegacyAccount, type LegacyAccountIdentity } from "../../account/accountDescriptor";
import { heldAccountMatcher } from "./heldAccounts";

// The coin-aleo testnet fixture account.
const address = "aleo1uhf67fhy46jvv5hadf586pkdarax6ppuzq8xtpk7jdk9hhujku8sfa39ml";
const viewKey = "AViewKey1jyaKC65RhaGN3b6h79hLdwTBk3YAMbRL1MMeCArLDJ6E";

const aleoAccount = (customData?: string): LegacyAccountIdentity => ({
  id: encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "aleo",
    xpubOrAddress: address,
    derivationMode: "aleo",
    customData,
  }),
  currency: { id: "aleo" },
  derivationMode: "aleo",
  index: 2,
  freshAddress: address,
});

const discovered = fromLegacyAccount(aleoAccount());

const ETH_ADDR = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
const SOL_ADDR = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const XPUB =
  "xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh";

const legacyAccount = (
  currencyId: string,
  derivationMode: DerivationMode,
  { xpub, freshAddress = "" }: { xpub?: string; freshAddress?: string },
): LegacyAccountIdentity => ({
  id: encodeAccountId({
    type: "js",
    version: "2",
    currencyId,
    xpubOrAddress: xpub ?? freshAddress,
    derivationMode,
  }),
  currency: { id: currencyId },
  derivationMode,
  index: 0,
  xpub,
  freshAddress,
});

describe("heldAccountMatcher", () => {
  it("matches a discovered Aleo account to the held one whose legacy id keeps the view key", () => {
    const isHeld = heldAccountMatcher([aleoAccount(viewKey)]);
    expect(discovered.key).toBe(address);
    expect(isHeld(discovered)).toBe(true);
  });

  it("does not match an account the store does not hold", () => {
    expect(heldAccountMatcher([])(discovered)).toBe(false);
  });

  it("matches a held checksummed EVM address to the same address discovered in lowercase", () => {
    const held = legacyAccount("ethereum", "", { freshAddress: ETH_ADDR });
    const lowercase = fromLegacyAccount(
      legacyAccount("ethereum", "", { freshAddress: ETH_ADDR.toLowerCase() }),
    );
    expect(heldAccountMatcher([held])(lowercase)).toBe(true);
  });

  it.each([
    ["an xpub", "bitcoin", "native_segwit", { xpub: XPUB }],
    ["a case-sensitive address", "solana", "solanaMain", { freshAddress: SOL_ADDR }],
  ] as const)("keeps the case of %s", (_, currencyId, derivationMode, subject) => {
    const held = legacyAccount(currencyId, derivationMode, subject);
    const lowercased = Object.fromEntries(
      Object.entries(subject).map(([field, key]) => [field, key.toLowerCase()]),
    );
    const other = fromLegacyAccount(legacyAccount(currencyId, derivationMode, lowercased));
    expect(heldAccountMatcher([held])(other)).toBe(false);
    expect(heldAccountMatcher([held])(fromLegacyAccount(held))).toBe(true);
  });

  it("skips a held account its family cannot express", () => {
    const broken = { ...aleoAccount(viewKey), currency: { id: "bitcoin" } };
    expect(heldAccountMatcher([broken])(discovered)).toBe(false);
  });
});
