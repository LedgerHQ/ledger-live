import { getSs58Prefix, SS58_PREFIX_BY_CURRENCY, DEFAULT_SS58_PREFIX } from "./ss58";

describe("getSs58Prefix", () => {
  it("returns 0 for polkadot", () => {
    expect(getSs58Prefix("polkadot")).toBe(0);
  });

  it("returns 0 for assethub_polkadot", () => {
    expect(getSs58Prefix("assethub_polkadot")).toBe(0);
  });

  it("returns 42 for westend", () => {
    expect(getSs58Prefix("westend")).toBe(42);
  });

  it("returns 42 for assethub_westend", () => {
    expect(getSs58Prefix("assethub_westend")).toBe(42);
  });

  it("returns 42 for bittensor", () => {
    expect(getSs58Prefix("bittensor")).toBe(42);
  });

  it("returns default (0) for unknown currency", () => {
    expect(getSs58Prefix("unknown")).toBe(DEFAULT_SS58_PREFIX);
  });

  it("returns default (0) for undefined", () => {
    expect(getSs58Prefix(undefined)).toBe(DEFAULT_SS58_PREFIX);
  });
});

describe("SS58_PREFIX_BY_CURRENCY", () => {
  it("maps each known polkadot-family currency to its ss58 prefix", () => {
    expect(SS58_PREFIX_BY_CURRENCY).toMatchObject({
      polkadot: 0,
      assethub_polkadot: 0,
      westend: 42,
      assethub_westend: 42,
      bittensor: 42,
    });
  });
});
