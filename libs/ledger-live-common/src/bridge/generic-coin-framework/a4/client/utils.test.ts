import { getEnv } from "@shared/env";
import { toA4Network, resolveA4BaseUrl } from "./utils";

jest.mock("@shared/env");

const mockGetEnv = jest.mocked(getEnv);

describe("resolveA4BaseUrl", () => {
  it.each([
    ["stg", "A4_URL_STG", "https://explorers.api.live.stg.ledger-test.com/a4"],
    ["ppr", "A4_URL_PPR", "https://explorers.api.live.ppr.ledger-test.com/a4"],
    ["prd", "A4_URL_PRD", "https://explorers.api.vault.ledger.com/a4"],
  ] as const)("returns env var for %s", (env, key, url) => {
    mockGetEnv.mockImplementation(k => (k === key ? url : ""));
    expect(resolveA4BaseUrl(env)).toEqual(url);
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
