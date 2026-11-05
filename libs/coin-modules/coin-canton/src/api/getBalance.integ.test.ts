import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getKey } from "../network/gateway";
import { getDevnetValidatorParty, UNKNOWN_PARTY } from "../test/devnet";
import { createMockCoinConfigValue, createMockContext } from "../test/fixtures";
import { createApi } from ".";

const config = createMockCoinConfigValue();
const context = createMockContext(config);
const api = createApi();

const assetKey = (asset: AssetInfo) =>
  "assetReference" in asset ? getKey(asset.assetReference ?? "", asset.assetOwner ?? "") : "native";

const isIdentifiedToken = (asset: AssetInfo) =>
  "assetReference" in asset && !!asset.assetReference && !!asset.assetOwner;

describe("getBalance (devnet)", () => {
  it("returns no balance for a party the node does not host", async () => {
    await expect(api.getBalance(context, UNKNOWN_PARTY)).resolves.toEqual([]);
  });

  it("returns a native balance and at most one balance per asset for the validator party", async () => {
    const balances = await api.getBalance(context, await getDevnetValidatorParty(config));
    const keys = balances.map(balance => assetKey(balance.asset));
    const tokens = balances.filter(balance => balance.asset.type !== "native");

    expect(keys).toContain("native");
    expect(new Set(keys).size).toBe(keys.length);
    expect(tokens.every(balance => isIdentifiedToken(balance.asset))).toBe(true);
    expect(
      balances.every(
        balance => balance.value >= (balance.locked ?? 0n) && balance.locked !== undefined,
      ),
    ).toBe(true);
  });
});
