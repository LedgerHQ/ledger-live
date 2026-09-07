import { getEnv } from "@shared/env";
import { toA4Network, resolveA4BaseUrl, normalizeAccountKey } from "./utils";

jest.mock("@shared/env");

const mockGetEnv = jest.mocked(getEnv);

describe("resolveA4BaseUrl", () => {
  it.each([
    ["stg", "A4_URL_STG", "https://explorers.api.live.stg.ledger-test.com/a4"],
    ["ppr", "A4_URL_PPR", "https://explorers.api.live.ppr.ledger-test.com/a4"],
    ["prd", "A4_URL_PRD", "https://explorers.api.live.ledger.com/a4"],
  ] as const)("returns env var for %s", (env, key, url) => {
    mockGetEnv.mockImplementation(k => (k === key ? url : ""));
    expect(resolveA4BaseUrl(env)).toEqual(url);
  });
});

describe("normalizeAccountKey", () => {
  it("lowercases EVM 0x address (gold pair: checksummed → lowercase)", () => {
    expect(normalizeAccountKey("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toEqual(
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    );
  });

  it("is a no-op for already-lowercase EVM address", () => {
    expect(normalizeAccountKey("0x742d35cc6634c0532925a3b844bc454e4438f44e")).toEqual(
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    );
  });

  it.each([
    [
      "bitcoin xpub",
      "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz",
    ],
    ["ripple", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"],
    ["solana", "EkmJ7PEGdPhUH1MSHcjLnz5MN8aJMGrxvfDz5kJKsmYT"],
    ["tron", "TJmV3QHMiDHpFSs9v5BKxJaVxpAV3q6QnF"],
  ])("keeps %s address verbatim", (_, input) => {
    expect(normalizeAccountKey(input)).toEqual(input);
  });
});

describe("toA4Network", () => {
  it("maps xrp to ripple", () => {
    expect(toA4Network("xrp")).toEqual("ripple");
  });

  it.each([["ethereum"], ["solana"], ["bitcoin"], ["polygon"]])("returns identity for %s", id => {
    expect(toA4Network(id)).toEqual(id);
  });

  it("returns null for unknown currency id", () => {
    expect(toA4Network("totally_unknown_chain")).toEqual(null);
  });
});
