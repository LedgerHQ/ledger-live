import { toLongStructTag, toShortStructTag } from "./utils";

describe("toLongStructTag", () => {
  const CETUS_LONG =
    "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS";

  it("pads a short-form SUI coin type to 64 digits", () => {
    expect(toLongStructTag("0x2::sui::SUI")).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    );
  });

  it("restores the leading zero that toShortStructTag stripped from a token type", () => {
    expect(toLongStructTag(toShortStructTag(CETUS_LONG))).toBe(CETUS_LONG);
  });

  it("leaves a full-length address unchanged and preserves module/struct casing", () => {
    expect(toLongStructTag(CETUS_LONG)).toBe(CETUS_LONG);
  });

  it("pads each address segment of a generic type", () => {
    expect(toLongStructTag("0x2::coin::Coin<0x2::sui::SUI>")).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>",
    );
  });

  it("leaves a `0x` sequence inside a module or struct name unchanged", () => {
    expect(toLongStructTag("0x2::token0x2::TOKEN0xAB")).toBe(
      `0x${"2".padStart(64, "0")}::token0x2::TOKEN0xAB`,
    );
  });

  it("lowercases uppercase hex while padding", () => {
    expect(toLongStructTag("0xABC::mod::NAME")).toBe(`0x${"abc".padStart(64, "0")}::mod::NAME`);
  });

  it("leaves a hex run longer than 64 digits unchanged", () => {
    const tooLong = `0x1${"0".repeat(64)}::mod::NAME`;
    expect(toLongStructTag(tooLong)).toBe(tooLong);
  });

  it("leaves a non-struct-tag string unchanged", () => {
    expect(toLongStructTag("random coin type 1")).toBe("random coin type 1");
  });
});

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
