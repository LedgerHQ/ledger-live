import { RecordDecodeError } from "@shared/persistence";
import { appendAccounts, CLI_WRITTEN_VERSION, parseStoredAccount, wrapRaw } from "../envelope";
import { ACCOUNTS_VERSION_LINE } from "../versionLine";

const raw = { id: "js:2:ethereum:0xabc:", currencyId: "ethereum", operations: [] };

describe("the accounts version line", () => {
  it("has the 3 steps of the legacy desktop model, in order", () => {
    expect(ACCOUNTS_VERSION_LINE).toEqual([
      "idFormat2018",
      "aptosHardenedPath",
      "cryptoOrgResources",
    ]);
  });
});

describe("parseStoredAccount", () => {
  it.each([0, 1, 3])(
    "accepts a stored account at version %i and keeps its data fields",
    version => {
      expect(parseStoredAccount({ data: raw, version })).toEqual({ data: raw, version });
    },
  );

  it.each([
    ["a string", "ciphertext"],
    ["no data", { version: 3 }],
    ["no id", { data: { currencyId: "bitcoin" }, version: 3 }],
    ["a negative version", { data: raw, version: -1 }],
    ["a decimal version", { data: raw, version: 1.5 }],
    ["a version above the line", { data: raw, version: 4 }],
    ["an unknown envelope key", { data: raw, version: 3, $v: 1 }],
  ])("refuses %s", (_label, stored) => {
    expect(() => parseStoredAccount(stored)).toThrow(RecordDecodeError);
  });

  it("keeps the account out of the error", () => {
    const error = (() => {
      try {
        parseStoredAccount({ data: { ...raw, id: 42, xpub: "secret-xpub" }, version: 3 });
      } catch (caught) {
        return caught;
      }
    })();
    expect(String(error)).not.toContain("secret-xpub");
  });
});

describe("wrapRaw", () => {
  it("wraps a raw account at the version that apps/cli writes", () => {
    expect(wrapRaw(raw)).toEqual({ data: raw, version: CLI_WRITTEN_VERSION });
    expect(CLI_WRITTEN_VERSION).toBe(1);
  });

  it("refuses a raw account with no currency", () => {
    expect(() => wrapRaw({ id: "x" } as never)).toThrow(RecordDecodeError);
  });
});

describe("appendAccounts", () => {
  it("keeps the stored accounts as they are and adds only the new ids", () => {
    const unreadable = { data: { id: "b", currencyId: "x" }, version: 9 };
    const stored = [wrapRaw({ ...raw, id: "a" }), unreadable];

    expect(
      appendAccounts(stored, [wrapRaw({ ...raw, id: "b" }), wrapRaw({ ...raw, id: "c" })]),
    ).toEqual([...stored, wrapRaw({ ...raw, id: "c" })]);
  });
});
