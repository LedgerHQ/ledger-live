import { describe, expect, it } from "bun:test";
import type { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { parseShortAccountDescriptor, parseAccountDescriptor, toTokenInfo } from "./models";
import { XPUB } from "../shared/accountDescriptor/test-fixtures";

const SHORT = `js:2:bitcoin:${XPUB}:native_segwit:0`;

describe("parseShortAccountDescriptor", () => {
  it("parses a valid short descriptor", () => {
    const result = parseShortAccountDescriptor(SHORT);
    expect(result.currencyId).toBe("bitcoin");
    expect(result.seedIdentifier).toBe(XPUB);
    expect(result.derivationMode).toBe("native_segwit");
    expect(result.index).toBe(0);
    expect(result.freshAddress).toBe("");
    expect(result.id).toBe(`js:2:bitcoin:${XPUB}:native_segwit`);
  });

  it("parses non-zero account index", () => {
    const result = parseShortAccountDescriptor(`js:2:bitcoin:${XPUB}:native_segwit:3`);
    expect(result.index).toBe(3);
  });

  it("throws when there is no colon", () => {
    expect(() => parseShortAccountDescriptor("nocolon")).toThrow(
      /Invalid short account descriptor/,
    );
  });

  it("throws when index is not a number", () => {
    expect(() => parseShortAccountDescriptor(`js:2:bitcoin:${XPUB}:native_segwit:abc`)).toThrow(
      /Invalid short account descriptor/,
    );
  });
});

describe("parseAccountDescriptor", () => {
  it("delegates to toV0(parseV1()) for V1-prefixed input", () => {
    const v1Input = `account:1:utxo:bitcoin:main:${XPUB}:m/84h/0h/0h`;
    const result = parseAccountDescriptor(v1Input);
    expect(result.currencyId).toBe("bitcoin");
    expect(result.seedIdentifier).toBe(XPUB);
    expect(result.derivationMode).toBe("native_segwit");
    expect(result.index).toBe(0);
  });

  it("delegates to parseShortAccountDescriptor for js:2: input", () => {
    const result = parseAccountDescriptor(SHORT);
    expect(result.currencyId).toBe("bitcoin");
    expect(result.index).toBe(0);
  });

  it("propagates errors from parseV1 for invalid V1 input", () => {
    expect(() => parseAccountDescriptor("account:1:bad")).toThrow();
  });
});

describe("toTokenInfo", () => {
  const usdtFixture: TokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/usd_tether__erc20_",
    name: "Tether USD",
    ticker: "USDT",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    tokenType: "erc20",
    units: [
      { name: "USDT", code: "USDT", magnitude: 6 },
      { name: "micro USDT", code: "uUSDT", magnitude: 0 },
    ],
    parentCurrency: { id: "ethereum" } as CryptoCurrency,
  };

  it("maps id, ticker, name, contract, tokenType verbatim", () => {
    const info = toTokenInfo(usdtFixture);
    expect(info.id).toBe("ethereum/erc20/usd_tether__erc20_");
    expect(info.ticker).toBe("USDT");
    expect(info.name).toBe("Tether USD");
    expect(info.contractAddress).toBe("0xdac17f958d2ee523a2206206994597c13d831ec7");
    expect(info.tokenType).toBe("erc20");
  });

  it("pulls decimals from units[0].magnitude", () => {
    expect(toTokenInfo(usdtFixture).decimals).toBe(6);
  });

  it("derives parentCurrencyId from parentCurrency.id", () => {
    expect(toTokenInfo(usdtFixture).parentCurrencyId).toBe("ethereum");
  });

  it("omits delisted when not set on the source", () => {
    const info = toTokenInfo(usdtFixture);
    expect("delisted" in info).toBe(false);
  });

  it("preserves delisted=true when flagged on the source", () => {
    expect(toTokenInfo({ ...usdtFixture, delisted: true }).delisted).toBe(true);
  });

  it("throws when the token has no units", () => {
    expect(() => toTokenInfo({ ...usdtFixture, units: [] })).toThrow(/no units/);
  });
});
