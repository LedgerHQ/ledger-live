import { resolveFeeCurrency } from "./feeCurrency";

// USDC on Celo (6 decimals): CIP-64 references it via an adapter contract that
// normalizes to 18 decimals. The transaction's `feeCurrency` must be the adapter.
const USDC_CONTRACT = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

// USAT (Tether America USD), also 6 decimals.
const USAT_CONTRACT = "0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771";
const USAT_ADAPTER = "0x0357EE22278c922e1D36cFe6b899269b161880C4";

describe("resolveFeeCurrency", () => {
  it("returns undefined when nothing is selected (native CELO gas)", () => {
    expect(resolveFeeCurrency(undefined)).toBeUndefined();
  });

  it("maps a known token contract address to its CIP-64 adapter address", () => {
    expect(resolveFeeCurrency(USDC_CONTRACT)).toBe(USDC_ADAPTER);
  });

  it("accepts an adapter address directly and returns it unchanged", () => {
    expect(resolveFeeCurrency(USDC_ADAPTER)).toBe(USDC_ADAPTER);
  });

  it("matches addresses case-insensitively", () => {
    expect(resolveFeeCurrency(USDC_CONTRACT.toLowerCase())).toBe(USDC_ADAPTER);
  });

  it("resolves USAT from either its token contract or its adapter", () => {
    expect(resolveFeeCurrency(USAT_CONTRACT)).toBe(USAT_ADAPTER);
    expect(resolveFeeCurrency(USAT_ADAPTER)).toBe(USAT_ADAPTER);
  });

  it("returns undefined for an address that is not an allowlisted fee currency", () => {
    expect(resolveFeeCurrency("0x1111111111111111111111111111111111111111")).toBeUndefined();
  });
});
