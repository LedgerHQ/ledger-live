import { toShortStructTag } from "./utils";

describe("toShortStructTag", () => {
  it("strips leading zeros from a long-form SUI coin type", () => {
    expect(
      toShortStructTag(
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
      ),
    ).toBe("0x2::sui::SUI");
  });

  it("strips leading zeros from a long-form event type", () => {
    expect(
      toShortStructTag(
        "0x0000000000000000000000000000000000000000000000000000000000000003::validator::StakingRequestEvent",
      ),
    ).toBe("0x3::validator::StakingRequestEvent");
  });

  it("is a no-op for an already short-form type tag", () => {
    expect(toShortStructTag("0x2::sui::SUI")).toBe("0x2::sui::SUI");
  });

  it("leaves a full-address token type unchanged (no leading zeros to strip)", () => {
    const usdc = "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC";
    expect(toShortStructTag(usdc)).toBe(usdc);
  });

  it("preserves module and struct name casing while lowercasing the address hex", () => {
    expect(
      toShortStructTag(
        "0x00000000000000000000000000000000000000000000000000000000000000AB::myMod::MyCoin",
      ),
    ).toBe("0xab::myMod::MyCoin");
  });

  it("normalises nested address segments in a generic type", () => {
    expect(
      toShortStructTag(
        "0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>",
      ),
    ).toBe("0x2::coin::Coin<0x2::sui::SUI>");
  });

  it("keeps a single zero for the zero address", () => {
    expect(
      toShortStructTag(
        "0x0000000000000000000000000000000000000000000000000000000000000000::mod::T",
      ),
    ).toBe("0x0::mod::T");
  });

  it("strips leading zeros from a bare object id (SIP-58 accumulator root)", () => {
    expect(
      toShortStructTag("0x0000000000000000000000000000000000000000000000000000000000000acc"),
    ).toBe("0xacc");
  });
});
