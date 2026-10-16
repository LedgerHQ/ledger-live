import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import type { OperationCommon } from "../types";
import { assetOperations, lateTokenBalances, vanishedTokenBalances } from "./tokens";

const held: Balance = {
  value: 500n,
  asset: { type: "token", assetReference: "0xheld", assetOwner: "addr" },
};
const account = (...tokenIds: string[]) =>
  ({ subAccounts: tokenIds.map(id => ({ token: { id } })) }) as unknown as Account;

describe("vanishedTokenBalances", () => {
  it("contributes nothing without a getAssetFromToken hook, or without a stored sub-account", () => {
    expect(vanishedTokenBalances(account("tok"), [held], undefined, "addr")).toEqual([]);
    expect(vanishedTokenBalances(undefined, [held], () => undefined, "addr")).toEqual([]);
  });

  it("adds a zero balance for a stored token the balance list no longer reports", () => {
    const vanished = { type: "token", assetReference: "0xgone", assetOwner: "addr" };
    const getAssetFromToken = jest.fn(() => vanished);

    expect(vanishedTokenBalances(account("gone"), [held], getAssetFromToken, "addr")).toEqual([
      { value: 0n, asset: vanished },
    ]);
    expect(getAssetFromToken).toHaveBeenCalledWith({ id: "gone" }, "addr");
    // Even when the list reports no token at all (the only one got swept).
    expect(vanishedTokenBalances(account("gone"), [], getAssetFromToken, "addr")).toHaveLength(1);
  });

  it("matches the references of the balance list case-insensitively", () => {
    const native: Balance = { value: 1n, asset: { type: "native" } };

    expect(
      vanishedTokenBalances(
        account("held"),
        [native, held],
        () => ({ type: "token", assetReference: "0xHELD" }),
        "addr",
      ),
    ).toEqual([]);
  });

  it.each([
    ["no asset", () => undefined],
    ["a native-shaped asset", () => ({ type: "native" })],
    ["an empty reference", () => ({ type: "token", assetReference: "" })],
    [
      "a throwing hook",
      () => {
        throw new Error("boom");
      },
    ],
  ])("skips a stored token when the family answers %s", (_label, getAssetFromToken) => {
    expect(
      vanishedTokenBalances(account("tok"), [held], getAssetFromToken as never, "addr"),
    ).toEqual([]);
  });
});

const op = (type: string, extra: Record<string, unknown>) =>
  ({ type, extra }) as unknown as OperationCommon;

describe("assetOperations", () => {
  it("keeps the operations of a token, not its opt-in nor opt-out", () => {
    const tokenOut = op("OUT", { assetReference: "0xt", assetOwner: "addr" });
    expect(
      assetOperations([
        tokenOut,
        op("OPT_IN", { assetReference: "0xt", assetOwner: "addr" }),
        op("OPT_OUT", { assetReference: "0xt", assetOwner: "addr" }),
        op("OUT", { assetReference: "0xt" }),
        op("OUT", {}),
      ]),
    ).toEqual([tokenOut]);
  });
});

describe("lateTokenBalances", () => {
  const transfer = (assetReference: string) =>
    ({
      hash: assetReference,
      extra: { assetReference, assetOwner: "addr" },
    }) as unknown as OperationCommon;
  const tokenOf = (asset: AssetInfo) =>
    ({ id: `token-${(asset as { assetReference: string }).assetReference.toLowerCase()}` }) as
      | TokenCurrency
      | undefined;
  const assetOf = (token: TokenCurrency): AssetInfo => ({
    type: "token",
    assetReference: token.id.replace("token-", ""),
    assetOwner: "addr",
  });
  const lookups = {
    getTokenFromAsset: jest.fn(async (asset: AssetInfo) => tokenOf(asset)),
    getAssetFromToken: jest.fn(assetOf),
  };

  beforeEach(() => jest.clearAllMocks());

  it("reads again the tokens listed without a balance, once each, keeping their entries only", async () => {
    const read = jest.fn(async (assets: AssetInfo[]) => [
      held,
      ...assets.map(asset => ({ value: 3n, asset })),
    ]);

    const late = await lateTokenBalances(
      [transfer("0xheld"), transfer("0xLATE"), transfer("0xlate")],
      [held],
      lookups,
      "addr",
      [],
      read,
    );

    expect(lookups.getTokenFromAsset).toHaveBeenCalledTimes(1);
    expect(lookups.getTokenFromAsset).toHaveBeenCalledWith({
      type: "token",
      assetReference: "0xLATE",
      assetOwner: "addr",
    });
    expect(read).toHaveBeenCalledWith([
      { type: "token", assetReference: "0xlate", assetOwner: "addr" },
    ]);
    expect(late).toEqual([
      { value: 3n, asset: { type: "token", assetReference: "0xlate", assetOwner: "addr" } },
    ]);
  });

  it("reads nothing for an unlisted, a blacklisted or a balanced token, nor without lookups", async () => {
    const read = jest.fn(async () => []);
    const unlisted = { ...lookups, getTokenFromAsset: jest.fn(async () => undefined) };

    expect(await lateTokenBalances([transfer("0xspam")], [], unlisted, "addr", [], read)).toEqual(
      [],
    );
    expect(
      await lateTokenBalances([transfer("0xbad")], [], lookups, "addr", ["token-0xbad"], read),
    ).toEqual([]);
    expect(
      await lateTokenBalances([transfer("0xheld")], [held], lookups, "addr", [], read),
    ).toEqual([]);
    expect(
      await lateTokenBalances(
        [transfer("0xlate")],
        [],
        { getTokenFromAsset: lookups.getTokenFromAsset },
        "addr",
        [],
        read,
      ),
    ).toEqual([]);
    expect(read).not.toHaveBeenCalled();
  });

  it("looks the tokens up in batches of 50", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const getTokenFromAsset = jest.fn(async (asset: AssetInfo) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise(resolve => setImmediate(resolve));
      inFlight -= 1;
      return tokenOf(asset);
    });
    const transfers = Array.from({ length: 120 }, (_, i) => transfer(`0x${i}`));

    await lateTokenBalances(
      transfers,
      [],
      { ...lookups, getTokenFromAsset },
      "addr",
      [],
      async () => [],
    );

    expect(getTokenFromAsset).toHaveBeenCalledTimes(120);
    expect(maxInFlight).toBe(50);
  });

  it("fails when a lookup fails, rather than reading the token as unlisted", async () => {
    const failing = {
      ...lookups,
      getTokenFromAsset: jest.fn(async () => Promise.reject(new Error("down"))),
    };

    await expect(
      lateTokenBalances([transfer("0xlate")], [], failing, "addr", [], async () => []),
    ).rejects.toThrow("down");
  });
});
