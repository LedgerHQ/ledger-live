import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getBridgeApi } from "./bridge";

describe("getBridgeApi", () => {
  it("resolves hedera's bridge api, calling its factory form with the currency", async () => {
    const hedera = getCryptoCurrencyById("hedera");

    const bridgeApi = await getBridgeApi(hedera, "hedera");

    expect(bridgeApi.stakingSupported).toBe(true);
    expect(bridgeApi.getTokenFromAsset).toBeInstanceOf(Function);
    expect(bridgeApi.getAssetFromToken).toBeInstanceOf(Function);
  });

  it("returns an empty object for a family with no registered bridge api", async () => {
    const currency = getCryptoCurrencyById("hedera");

    const bridgeApi = await getBridgeApi(currency, "not-a-real-family");

    expect(bridgeApi).toEqual({});
  });
});
