import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { AccountCandidateSchema } from "./schema";
import { candidateOf, derivationModesOf, offersNewAccount, scanOf } from "./scan";

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

describe("derivation scan", () => {
  it("lists the modes of a currency in scan order, the standard one last", () => {
    expect(derivationModesOf(ethereum)).toEqual(["ethM", "ethMM", ""]);
    expect(derivationModesOf(bitcoin)).toEqual(["native_segwit", "taproot", "segwit", ""]);
  });

  it("gives a candidate its network and both paths", () => {
    expect(candidateOf(bitcoin, "native_segwit", 2)).toMatchObject({
      derivationMode: "native_segwit",
      index: 2,
      accountPath: "m/84h/0h/2h",
      addressPath: "m/84h/0h/2h/0/0",
    });
  });

  it("bounds a mode: a single account, a later start, a skipped first index, a wider gap", () => {
    expect(scanOf(ethereum, "").stopAt).toBe(255);
    expect(scanOf(getCryptoCurrencyById("solana"), "solanaMain").stopAt).toBe(1);
    expect(scanOf(getCryptoCurrencyById("tezos"), "galleonL").startsAt).toBe(1);
    expect(scanOf(ethereum, "ethMM").supportsIndex(0)).toBe(false);
    expect(scanOf(ethereum, "", { keychainObservableRange: 3 }).mandatoryEmptyAccountSkip).toBe(3);
  });

  it("offers a new account in the standard mode, not in a legacy one unless asked", () => {
    expect(offersNewAccount(ethereum, "")).toBe(true);
    expect(offersNewAccount(ethereum, "ethM")).toBe(false);
    expect(offersNewAccount(bitcoin, "taproot")).toBe(true);
  });
});

describe("AccountCandidateSchema", () => {
  it("accepts every candidate of a scan and rejects an unknown mode", () => {
    const candidate = candidateOf(bitcoin, "taproot", 0);
    expect(AccountCandidateSchema.parse(candidate)).toEqual(candidate);
    expect(AccountCandidateSchema.safeParse({ ...candidate, derivationMode: "nope" }).success).toBe(
      false,
    );
  });

  it("rejects a path that is not BIP32, and spells a hardened segment with h", () => {
    const candidate = candidateOf(bitcoin, "taproot", 0);
    for (const accountPath of ["m/not-a-path", "m/2147483648h"]) {
      expect(AccountCandidateSchema.safeParse({ ...candidate, accountPath }).success).toBe(false);
    }
    expect(AccountCandidateSchema.parse({ ...candidate, accountPath: "m/86'/0'/0'" })).toEqual(
      candidate,
    );
  });
});
