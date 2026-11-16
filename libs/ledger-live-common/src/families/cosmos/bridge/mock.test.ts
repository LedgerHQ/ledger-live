import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getCurrentCosmosPreloadData } from "@ledgerhq/coin-cosmos/preloadedData";
import mockPreloadedData from "@ledgerhq/coin-cosmos/preloadedData.mock";
import mockBridge from "./mock";

const config = { lcd: "https://lcd.test", minGasPrice: 0.025, ledgerValidator: "" };

jest.mock("../../../config", () => ({
  getCurrencyConfiguration: jest.fn(() => config),
}));

describe("cosmos mock currency bridge", () => {
  it.each(["cosmos", "osmo"])("preloads the validators under %s", async currencyId => {
    await mockBridge.currencyBridge.preload?.(getCryptoCurrencyById(currencyId));
    expect(getCurrentCosmosPreloadData()[currencyId]?.validators).toEqual(
      mockPreloadedData.validators,
    );
  });

  it("hydrates the validators under the requested network", () => {
    const [validator] = mockPreloadedData.validators;
    mockBridge.currencyBridge.hydrate?.(
      { validators: [validator], config },
      getCryptoCurrencyById("axelar"),
    );
    expect(getCurrentCosmosPreloadData().axelar?.validators).toEqual([validator]);
  });
});
