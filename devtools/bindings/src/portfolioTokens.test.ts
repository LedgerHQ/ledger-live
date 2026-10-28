import { applyTokens, fetchTokens, tokenKey, type TokenInfo } from "./portfolioTokens";

const ADDRESS = `0x${"AB".repeat(20)}`;
const USDC: TokenInfo = { calId: "base/erc20/usdc", ticker: "USDC", name: "USD Coin", decimals: 6 };
const token = (asset: string, calId?: string) => ({ network: "base", asset, calId });

describe("tokenKey", () => {
  it("asks about a contract CAL has no id for, and not about a native asset", () => {
    expect(tokenKey(token(`erc20.${ADDRESS}`))).toBe(`base:${ADDRESS.toLowerCase()}`);
    expect(tokenKey(token("native"))).toBeUndefined();
  });
});

describe("fetchTokens", () => {
  it("looks each distinct token up once", async () => {
    const lookup = jest.fn().mockResolvedValue(USDC);
    const same = token(`erc20.${ADDRESS}`);

    const found = await fetchTokens([same, same, token("native")], lookup);

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith("base", ADDRESS.toLowerCase());
    expect(found.get(`base:${ADDRESS.toLowerCase()}`)).toEqual(USDC);
  });

  it("skips a lookup that fails", async () => {
    const lookup = jest.fn().mockRejectedValue(new Error("CAL down"));

    const found = await fetchTokens([token(`erc20.${ADDRESS}`)], lookup);

    expect(found.size).toBe(0);
  });
});

describe("applyTokens", () => {
  it("completes an asset with its token", async () => {
    const asset = { ...token(`erc20.${ADDRESS}`), ticker: `erc20.${ADDRESS}`, decimals: 0 };
    const tokens = await fetchTokens([asset], async () => USDC);

    expect(applyTokens(asset, tokens)).toMatchObject({
      calId: "base/erc20/usdc",
      ticker: "USDC",
      decimals: 6,
    });
  });
});
