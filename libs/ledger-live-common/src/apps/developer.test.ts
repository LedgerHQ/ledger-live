import { getAppDeveloperType, isCommunityApp, isLedgerApp } from "./developer";

describe("getAppDeveloperType", () => {
  it.each([
    ["Ledger", "ledger"],
    [" Ledger ", "ledger"],
    ["ledger", "community"],
    ["LEDGER", "community"],
    ["Ledger SAS", "community"],
    ["Zondax", "community"],
    ["Vacuumlabs", "community"],
    ["", "community"],
    ["   ", "community"],
    [null, "community"],
    [undefined, "community"],
  ])("classifies authorName %p as %p", (authorName, expected) => {
    expect(getAppDeveloperType({ authorName })).toBe(expected);
  });
});

describe("isLedgerApp / isCommunityApp", () => {
  it("returns true only for the matching developer type", () => {
    expect(isLedgerApp({ authorName: "Ledger" })).toBe(true);
    expect(isCommunityApp({ authorName: "Ledger" })).toBe(false);
    expect(isLedgerApp({ authorName: "Zondax" })).toBe(false);
    expect(isCommunityApp({ authorName: "Zondax" })).toBe(true);
  });

  it("treats a missing authorName as a community app", () => {
    expect(isLedgerApp({ authorName: undefined })).toBe(false);
    expect(isCommunityApp({ authorName: undefined })).toBe(true);
  });
});
