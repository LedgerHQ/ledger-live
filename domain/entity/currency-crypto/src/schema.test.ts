import {
  ExplorerViewSchema,
  BitcoinLikeInfoSchema,
  EthereumLikeInfoSchema,
  CryptoCurrencySchema,
} from "./schema";
import { mockCryptoCurrency } from "./schema.mock";

describe("ExplorerViewSchema", () => {
  it("accepts an empty object", () => {
    expect(ExplorerViewSchema.parse({})).toEqual({});
  });

  it("accepts all optional fields", () => {
    const view = {
      tx: "https://example.com/tx/$hash",
      address: "https://example.com/address/$address",
    };
    expect(ExplorerViewSchema.parse(view)).toEqual(view);
  });
});

describe("BitcoinLikeInfoSchema", () => {
  it("accepts valid bitcoin info", () => {
    expect(BitcoinLikeInfoSchema.parse({ P2PKH: 0, P2SH: 5 })).toEqual({ P2PKH: 0, P2SH: 5 });
  });

  it("accepts XPUBVersion", () => {
    const result = BitcoinLikeInfoSchema.parse({ P2PKH: 0, P2SH: 5, XPUBVersion: 76066276 });
    expect(result.XPUBVersion).toBe(76066276);
  });
});

describe("EthereumLikeInfoSchema", () => {
  it("accepts valid chainId", () => {
    expect(EthereumLikeInfoSchema.parse({ chainId: 1 })).toEqual({ chainId: 1 });
  });
});

describe("CryptoCurrencySchema", () => {
  it("parses a valid currency from mock factory", () => {
    const currency = mockCryptoCurrency();
    const result = CryptoCurrencySchema.parse(currency);
    expect(result.id).toBe("bitcoin");
    expect(result.type).toBe("CryptoCurrency");
  });

  it("requires at least one unit", () => {
    expect(() =>
      CryptoCurrencySchema.parse(
        mockCryptoCurrency({
          units: [],
        }),
      ),
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    const { managerAppName: _, ...withoutManager } = mockCryptoCurrency();
    expect(() => CryptoCurrencySchema.parse(withoutManager)).toThrow();
  });

  it("rejects wrong type discriminant", () => {
    expect(() =>
      CryptoCurrencySchema.parse({ ...mockCryptoCurrency(), type: "TokenCurrency" }),
    ).toThrow();
  });

  it("accepts optional fields when provided", () => {
    const currency = mockCryptoCurrency({
      forkedFrom: "bitcoin",
      blockAvgTime: 600,
      supportsSegwit: true,
      supportsNativeSegwit: true,
      keywords: ["btc", "bitcoin"],
      tokenTypes: ["omni"],
    });
    const result = CryptoCurrencySchema.parse(currency);
    expect(result.forkedFrom).toBe("bitcoin");
    expect(result.blockAvgTime).toBe(600);
    expect(result.supportsSegwit).toBe(true);
    expect(result.keywords).toEqual(["btc", "bitcoin"]);
  });

  it("accepts terminated field", () => {
    const currency = mockCryptoCurrency({ terminated: { link: "https://example.com" } });
    const result = CryptoCurrencySchema.parse(currency);
    expect(result.terminated?.link).toBe("https://example.com");
  });
});
