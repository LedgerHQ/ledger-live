import { toSlug } from "../toSlug";

describe("toSlug", () => {
  it.each([
    ["urn:crypto:meta-currency:usd_coin", "usd-coin"],
    ["urn:crypto:meta-currency:ethereum", "ethereum"],
    ["urn:crypto:meta-currency:bitcoin", "bitcoin"],
    ["urn:crypto:meta-currency:injective_protocol_v2", "injective-protocol-v2"],
    ["solana", "solana"],
    ["", ""],
  ])("toSlug(%j) → %j", (input, expected) => {
    expect(toSlug(input)).toBe(expected);
  });
});
