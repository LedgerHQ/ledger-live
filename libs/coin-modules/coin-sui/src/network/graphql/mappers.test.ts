/**
 * Tests for the GraphQL → JSON-RPC shape adapters in `./mappers.ts`.
 * Currently only `shortenCoinType`; add coverage here as the mapper
 * surface grows (system-state → SuiValidatorSummary, StakedSui grouping,
 * etc.).
 */
import { shortenCoinType } from "./mappers";

describe("shortenCoinType", () => {
  test("collapses leading zeros for the SUI native coin type", () => {
    expect(
      shortenCoinType(
        "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
      ),
    ).toBe("0x2::sui::SUI");
  });

  test("preserves non-zero address prefixes verbatim", () => {
    const ct = "0x9d49c70b621b618c7918468a7ac286e71cffe6e30c4e4175a4385516b121cb0e::usdc::USDC";
    expect(shortenCoinType(ct)).toBe(ct);
  });

  test("collapses an all-zero address to 0x0", () => {
    expect(
      shortenCoinType(
        "0x0000000000000000000000000000000000000000000000000000000000000000::null::Null",
      ),
    ).toBe("0x0::null::Null");
  });

  test("leaves an already-short type unchanged (idempotent)", () => {
    expect(shortenCoinType("0x2::sui::SUI")).toBe("0x2::sui::SUI");
  });

  test("returns inputs that don't match the Move type pattern unchanged", () => {
    expect(shortenCoinType("not-a-type")).toBe("not-a-type");
    expect(shortenCoinType("")).toBe("");
  });
});
