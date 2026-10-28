import { BigNumber } from "bignumber.js";
import { FEE_CURRENCY_BY_CONTRACT } from "../constants";
import { STANDARD_FEE_OPTION_ID, feeCurrencyForOption, getFeeOptions } from "./feeOptions";

const USDT = "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";
const USDC = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";
const NOT_ALLOWLISTED = "0x0000000000000000000000000000000000dead";

describe("getFeeOptions", () => {
  it("returns only the standard CELO option when no token is held", () => {
    expect(getFeeOptions([])).toEqual([
      { id: STANDARD_FEE_OPTION_ID, feeAsset: { type: "native", name: "CELO" } },
    ]);
  });

  it("lists held allowlisted tokens after standard, keyed by lowercased contract", () => {
    const options = getFeeOptions([
      { contractAddress: USDC, balance: 5n },
      { contractAddress: USDT, balance: new BigNumber(10) },
    ]);

    expect(options.map(o => o.id)).toEqual(["standard", USDC.toLowerCase(), USDT]);
    expect(options[1].feeAsset).toEqual({
      type: "erc20",
      assetReference: USDC,
      name: "USDC",
    });
  });

  it("omits zero-balance tokens", () => {
    const options = getFeeOptions([
      { contractAddress: USDT, balance: 0n },
      { contractAddress: USDC, balance: new BigNumber(0) },
    ]);

    expect(options.map(o => o.id)).toEqual(["standard"]);
  });

  it("omits tokens that are not allowlisted fee currencies", () => {
    expect(getFeeOptions([{ contractAddress: NOT_ALLOWLISTED, balance: 1n }])).toHaveLength(1);
  });

  it("matches the allowlist case-insensitively", () => {
    const options = getFeeOptions([
      { contractAddress: USDT.toUpperCase().replace("0X", "0x"), balance: 1n },
    ]);

    expect(options.map(o => o.id)).toEqual(["standard", USDT]);
  });

  it("returns fresh objects per call", () => {
    const first = getFeeOptions([]);
    (first[0].feeAsset as { name?: string }).name = "mutated";

    expect(getFeeOptions([])[0].feeAsset).toEqual({ type: "native", name: "CELO" });
  });
});

describe("getFeeOptions dedupe", () => {
  it("should list a token once when it appears in two casings", () => {
    const options = getFeeOptions([
      { contractAddress: USDC, balance: 1n },
      { contractAddress: USDC.toLowerCase(), balance: 2n },
    ]);
    expect(options.map(o => o.id)).toEqual([STANDARD_FEE_OPTION_ID, USDC.toLowerCase()]);
  });
});

describe("feeCurrencyForOption", () => {
  it("should return undefined when the id is standard", () => {
    expect(feeCurrencyForOption(STANDARD_FEE_OPTION_ID)).toBeUndefined();
  });

  it("should return undefined when the id is an adapter address, not a contract", () => {
    expect(feeCurrencyForOption(USDC_ADAPTER.toLowerCase())).toBeUndefined();
  });

  it("should resolve the adapter when the contract id is checksum-cased", () => {
    expect(feeCurrencyForOption(USDC)).toBe(USDC_ADAPTER);
  });

  it("resolves a token option id to the CIP-64 adapter address", () => {
    expect(feeCurrencyForOption(USDC.toLowerCase())).toBe(
      FEE_CURRENCY_BY_CONTRACT.get(USDC.toLowerCase())?.adapterAddress,
    );
    expect(feeCurrencyForOption(USDC.toLowerCase())).toBe(USDC_ADAPTER);
  });

  it("is undefined for an unknown id (pay in CELO)", () => {
    expect(feeCurrencyForOption("not-an-option")).toBeUndefined();
    expect(feeCurrencyForOption(NOT_ALLOWLISTED)).toBeUndefined();
  });
});
