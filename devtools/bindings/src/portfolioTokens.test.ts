import { applyTokens, fetchTokens, tokenKey, type TokenInfo } from "./portfolioTokens";

const ADDRESS = `0x${"AB".repeat(20)}`;
const USDC: TokenInfo = { calId: "base/erc20/usdc", ticker: "USDC", name: "USD Coin", decimals: 6 };
const token = (asset: string, calId?: string) => ({ network: "base", asset, calId });

describe("tokenKey", () => {
  it("asks about a contract asset CAL has no id for, whatever the case of the address", () => {
    expect(tokenKey(token(`erc20.${ADDRESS}`))).toBe(`base:${ADDRESS.toLowerCase()}`);
  });

  it.each([
    ["a native asset", token("native")],
    ["a token that already has its ledger id", token(`erc20.${ADDRESS}`, "base/erc20/x")],
    ["an asset that is not a contract address", token("erc20.notanaddress")],
  ])("does not ask about %s", (_, asset) => {
    expect(tokenKey(asset)).toBeUndefined();
  });
});

describe("fetchTokens", () => {
  it("looks each distinct token up once, with its network and lower-cased address", async () => {
    const lookup = jest.fn().mockResolvedValue(USDC);
    const same = token(`erc20.${ADDRESS}`);

    const found = await fetchTokens([same, same, token("native")], lookup);

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith("base", ADDRESS.toLowerCase());
    expect(found.get(`base:${ADDRESS.toLowerCase()}`)).toEqual(USDC);
  });

  it("skips a token CAL does not know and one whose lookup fails", async () => {
    const other = `0x${"cd".repeat(20)}`;
    const lookup = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("CAL down"));

    const found = await fetchTokens([token(`erc20.${ADDRESS}`), token(`erc20.${other}`)], lookup);

    expect(found.size).toBe(0);
  });

  it("stops at the lookup limit", async () => {
    const lookup = jest.fn().mockResolvedValue(USDC);
    const assets = Array.from({ length: 10 }, (_, i) =>
      token(`erc20.0x${i.toString(16).padStart(40, "0")}`),
    );

    await fetchTokens(assets, lookup, { maxLookups: 3 });

    expect(lookup).toHaveBeenCalledTimes(3);
  });
});

describe("applyTokens", () => {
  it("completes an asset with its token", async () => {
    const asset = { ...token(`erc20.${ADDRESS}`), ticker: `erc20.${ADDRESS}`, decimals: 0 };
    const tokens = await fetchTokens([asset], async () => USDC);

    expect(applyTokens(asset, tokens)).toMatchObject({
      calId: "base/erc20/usdc",
      ticker: "USDC",
      name: "USD Coin",
      decimals: 6,
    });
  });

  it("leaves an asset without a token as it is", () => {
    const asset = token(`erc20.${ADDRESS}`);
    expect(applyTokens(asset, new Map())).toBe(asset);
  });
});
