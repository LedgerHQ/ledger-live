import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CosmosValidatorsManager } from "../CosmosValidatorsManager";
import cosmosCoinConfig, { cosmosConfig } from "../config";
import { asSafeCosmosPreloadData, setCosmosPreloadData } from "../preloadedData";
import { CosmosCurrencyConfig, CosmosValidatorItem } from "../types";
import { hydrate } from "./preload";

jest.mock("@ledgerhq/cryptoassets", () => ({
  getCryptoCurrencyById: jest.fn(),
}));

jest.mock("../preloadedData", () => ({
  setCosmosPreloadData: jest.fn(),
  asSafeCosmosPreloadData: jest.fn(),
}));

jest.mock("../CosmosValidatorsManager", () => ({
  CosmosValidatorsManager: jest.fn().mockImplementation(() => ({
    hydrateValidators: jest.fn(),
  })),
}));

describe("hydrate", () => {
  const mockCurrency = { id: "cosmos" } as CryptoCurrency;
  const mockConfig = { lcd: "http://lcd-endpoint", minGasPrice: 0.025 } as CosmosCurrencyConfig;
  const mockValidators = [{ validatorAddress: "validator1" }] as CosmosValidatorItem[];

  beforeEach(() => {
    jest.clearAllMocks();
    LiveConfig.setConfig(cosmosConfig);
    cosmosCoinConfig.setCoinConfig(
      currency => LiveConfig.getValueByKey(`config_currency_${currency?.id}`) ?? {},
    );
  });

  it("should return undefined if data is corrupted", () => {
    const corruptedData = [
      undefined,
      null,
      {},
      { config: null },
      { config: undefined },
      { validators: null },
    ];
    corruptedData.forEach(data => {
      expect(hydrate(data as any, mockCurrency)).toBeUndefined();
    });
  });

  it("should set validators and config correctly", () => {
    const data = { config: mockConfig, validators: mockValidators };
    hydrate(data, mockCurrency);

    expect(getCryptoCurrencyById).toHaveBeenCalledWith(mockCurrency.id);
    expect(CosmosValidatorsManager).toHaveBeenCalledWith(getCryptoCurrencyById(mockCurrency.id));
    expect(setCosmosPreloadData).toHaveBeenCalledWith(
      mockCurrency.id,
      asSafeCosmosPreloadData(data),
    );
  });

  it("should return undefined if config is invalid", () => {
    const invalidConfigs = [
      { config: {}, validators: mockValidators },
      { config: { lcd: null }, validators: mockValidators },
      { config: { lcd: undefined }, validators: mockValidators },
      { config: { lcd: "http://lcd-endpoint" }, validators: mockValidators },
    ];
    invalidConfigs.forEach(data => {
      expect(hydrate(data as any, mockCurrency)).toBeUndefined();
    });
  });

  it("should return undefined if validators are invalid", () => {
    const invalidValidators = [
      { config: mockConfig, validators: null },
      { config: mockConfig, validators: undefined },
      { config: mockConfig, validators: {} },
    ];
    invalidValidators.forEach(data => {
      expect(hydrate(data as any, mockCurrency)).toBeUndefined();
    });
  });
});
