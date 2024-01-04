import { groupCurrenciesByProvider, searchByNameOrTicker, searchByProviderId } from "./helper";
import { MOCK } from "./mock";
import { MappedAsset } from "./type";
import { getTokenById } from "../currencies/index";

const MAPPED_ASSETS = MOCK as MappedAsset[];

describe("Deposit logic", () => {
  test("searchByProviderId", () => {
    const result = searchByProviderId(MAPPED_ASSETS, "tether");
    expect(result).toEqual(MAPPED_ASSETS);
  });

  test("searchByNameOrTicker", () => {
    const result = searchByNameOrTicker(MAPPED_ASSETS, "usdt");
    expect(result.length).toBeGreaterThan(0);
  });

  test("groupCurrenciesByProvider", () => {
    const currencies = MAPPED_ASSETS.map(asset => getTokenById(asset.ledgerId));
    const { currenciesByProvider } = groupCurrenciesByProvider(MAPPED_ASSETS, currencies);
    expect(currenciesByProvider).toEqual([
      {
        providerId: "tether",
        currenciesByNetwork: currencies,
      },
    ]);
  });
});
