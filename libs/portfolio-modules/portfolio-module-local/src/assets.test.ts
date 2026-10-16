import { assetMetadataOf, assetResolver, isNativeAsset, sumByAsset } from "./assets";
import { aLocalNetwork } from "./test-utils";

const native = { type: "native" };
const usdc = {
  type: "erc20",
  assetReference: "0xusdc",
  name: "USD Coin",
  unit: { name: "USDC", code: "USDC", magnitude: 6 },
};
const bitcoin = { name: "Bitcoin", ticker: "BTC", decimals: 8 };

const cardanoToken = { type: "native", assetReference: "policy.token" };

describe("isNativeAsset", () => {
  it("is the asset keyed native, not a token of type native", () => {
    expect(isNativeAsset(native)).toBe(true);
    expect(isNativeAsset(cardanoToken)).toBe(false);
    expect(isNativeAsset(usdc)).toBe(false);
  });
});

describe("assetMetadataOf", () => {
  it("describes the native asset as the network does", () => {
    expect(assetMetadataOf(native, bitcoin)).toBe(bitcoin);
  });

  it("describes a token from its name and unit", () => {
    expect(assetMetadataOf(usdc, bitcoin)).toEqual({
      name: "USD Coin",
      ticker: "USDC",
      decimals: 6,
    });
  });

  it("falls back to the asset key for a token without name nor unit", () => {
    expect(assetMetadataOf({ type: "erc20", assetReference: "0xabc" }, bitcoin)).toEqual({
      name: "0xabc",
      ticker: "",
      decimals: 0,
    });
  });

  it("describes a token of type native as a token", () => {
    expect(assetMetadataOf(cardanoToken, bitcoin)).toEqual({
      name: "policy.token",
      ticker: "",
      decimals: 0,
    });
  });
});

describe("assetResolver", () => {
  const listed = { cal_id: "ethereum/erc20/usd_coin", name: "USDC", ticker: "USDC", decimals: 6 };

  it("describes the native asset as the network does, without asking the client", async () => {
    const resolveAsset = jest.fn();
    const resolve = assetResolver(aLocalNetwork({ resolveAsset }));

    expect(await resolve(native)).toEqual({ name: "Bitcoin", ticker: "BTC", decimals: 8 });
    expect(resolveAsset).not.toHaveBeenCalled();
  });

  it("describes a token as the client's catalog does, with its catalog id", async () => {
    const resolveAsset = jest.fn(async () => ({ ...listed, extra: "dropped" }));
    const resolve = assetResolver(aLocalNetwork({ resolveAsset }));

    expect(await resolve(usdc)).toEqual(listed);
    expect(resolveAsset).toHaveBeenCalledWith(usdc);
  });

  it("describes a token by its own name and unit when the client does not list it", async () => {
    const own = { name: "USD Coin", ticker: "USDC", decimals: 6 };

    expect(await assetResolver(aLocalNetwork())(usdc)).toEqual(own);
    expect(
      await assetResolver(aLocalNetwork({ resolveAsset: async () => undefined }))(usdc),
    ).toEqual(own);
    expect(
      await assetResolver(
        aLocalNetwork({
          resolveAsset: async () => {
            throw new Error("catalog down");
          },
        }),
      )(usdc),
    ).toEqual(own);
  });

  it("looks each asset up once, told apart by type, reference and owner", async () => {
    const resolveAsset = jest.fn(async () => listed);
    const resolve = assetResolver(aLocalNetwork({ resolveAsset }));
    const issued = (assetOwner: string) => ({ type: "credit", assetReference: "USDC", assetOwner });

    await Promise.all([
      resolve(usdc),
      resolve({ ...usdc, name: "renamed" }),
      resolve(issued("issuer-1")),
      resolve(issued("issuer-1")),
      resolve(issued("issuer-2")),
      resolve({ type: "trc10" }),
    ]);

    expect(resolveAsset).toHaveBeenCalledTimes(4);
  });
});

describe("sumByAsset", () => {
  it("sums values and locked amounts per asset", () => {
    const sums = sumByAsset([
      { asset: native, value: 10n, locked: 2n },
      { asset: usdc, value: 5n },
      { asset: native, value: 3n },
    ]);

    expect([...sums]).toEqual([
      ["native", { asset: native, value: 13n, locked: 2n }],
      ["0xusdc", { asset: usdc, value: 5n, locked: 0n }],
    ]);
  });
});
