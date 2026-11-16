import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { renderHook } from "tests/testSetup";
import { useLLDCoinFamily } from "~/renderer/families";
import { useTokenTypes } from "~/renderer/families/useTokenTypes";

jest.mock("~/renderer/families", () => ({ useLLDCoinFamily: jest.fn() }));
const mockUseLLDCoinFamily = jest.mocked(useLLDCoinFamily);

const evm = { family: "evm", tokenTypes: ["erc20"] } as CryptoCurrency;
const xrp = { family: "xrp" } as CryptoCurrency;

const readTokenTypes = (currency: CryptoCurrency | undefined) =>
  renderHook(() => useTokenTypes(currency)).result.current;

describe("useTokenTypes", () => {
  it("returns the currency token types for a family without getTokenTypes", () => {
    mockUseLLDCoinFamily.mockReturnValue({});

    expect(readTokenTypes(evm)).toEqual(["erc20"]);
  });

  it("prefers the family token types over the currency ones", () => {
    mockUseLLDCoinFamily.mockReturnValue({ getTokenTypes: () => ["iou", "mpt"] });

    expect(readTokenTypes(evm)).toEqual(["iou", "mpt"]);
  });

  it("keeps an empty family answer instead of falling back to the currency", () => {
    mockUseLLDCoinFamily.mockReturnValue({ getTokenTypes: () => [] });

    expect(readTokenTypes(evm)).toEqual([]);
  });

  it("returns nothing for a currency with no token types", () => {
    mockUseLLDCoinFamily.mockReturnValue({});

    expect(readTokenTypes(xrp)).toEqual([]);
  });

  it("returns nothing without a currency", () => {
    mockUseLLDCoinFamily.mockReturnValue({});

    expect(readTokenTypes(undefined)).toEqual([]);
  });
});
