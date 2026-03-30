import { getStateFromPath } from "@react-navigation/native";
import { swapHandler } from "../../handlers/swap";
import type { ParsedDeeplink } from "../../types";
import { makeContext } from "../helpers";

jest.mock("@react-navigation/native", () => ({
  getStateFromPath: jest.fn((path: string) => ({ routes: [{ name: `nav:${path}` }] })),
}));

function makeParsed(params: Record<string, string> = {}): ParsedDeeplink {
  const search = new URLSearchParams(params).toString();
  const fullPath = search ? `swap?${search}` : "swap";
  const url = new URL(`ledgerwallet://${fullPath}`);
  return {
    hostname: "swap",
    pathname: "",
    platform: "",
    searchParams: url.searchParams,
    query: Object.fromEntries(url.searchParams),
    rawPath: fullPath,
    url,
  };
}

describe("swapHandler", () => {
  const mockedGetStateFromPath = jest.mocked(getStateFromPath);

  beforeEach(() => {
    mockedGetStateFromPath.mockClear();
  });

  it("calls getStateFromPath with 'swap' when no params are provided", () => {
    swapHandler(makeParsed(), makeContext());

    expect(mockedGetStateFromPath).toHaveBeenCalledWith("swap", undefined);
  });

  it("remaps fromToken → fromTokenId", () => {
    swapHandler(makeParsed({ fromToken: "ethereum" }), makeContext());

    const [path] = mockedGetStateFromPath.mock.calls[0];
    expect(path).toContain("fromTokenId=ethereum");
    expect(path).not.toContain("fromToken=");
  });

  it("remaps toToken → toTokenId", () => {
    swapHandler(makeParsed({ toToken: "bitcoin" }), makeContext());

    const [path] = mockedGetStateFromPath.mock.calls[0];
    expect(path).toContain("toTokenId=bitcoin");
    expect(path).not.toContain("toToken=");
  });

  it("remaps fromCurrency → fromCurrencyId", () => {
    swapHandler(makeParsed({ fromCurrency: "ethereum" }), makeContext());

    const [path] = mockedGetStateFromPath.mock.calls[0];
    expect(path).toContain("fromCurrencyId=ethereum");
    expect(path).not.toContain("fromCurrency=");
  });

  it("remaps toCurrency → toCurrencyId", () => {
    swapHandler(makeParsed({ toCurrency: "bitcoin" }), makeContext());

    const [path] = mockedGetStateFromPath.mock.calls[0];
    expect(path).toContain("toCurrencyId=bitcoin");
    expect(path).not.toContain("toCurrency=");
  });

  it("passes through fromPath, amountFrom and affiliate unchanged", () => {
    swapHandler(
      makeParsed({ fromPath: "earn", amountFrom: "0.5", affiliate: "partner" }),
      makeContext(),
    );

    const [path] = mockedGetStateFromPath.mock.calls[0];
    expect(path).toContain("fromPath=earn");
    expect(path).toContain("amountFrom=0.5");
    expect(path).toContain("affiliate=partner");
  });

  it("omits params with no value", () => {
    swapHandler(makeParsed({ fromToken: "eth" }), makeContext());

    const [path] = mockedGetStateFromPath.mock.calls[0];
    expect(path).not.toContain("toTokenId");
    expect(path).not.toContain("fromCurrencyId");
    expect(path).not.toContain("toCurrencyId");
  });

  it("returns the result of getStateFromPath", () => {
    const result = swapHandler(makeParsed(), makeContext());
    expect(result).toEqual({ routes: [{ name: "nav:swap" }] });
  });
});
