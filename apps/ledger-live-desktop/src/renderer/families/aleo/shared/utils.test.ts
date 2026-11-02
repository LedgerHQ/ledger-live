import BigNumber from "bignumber.js";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { getAleoCurrencyConfig, formatAleoBalances } from "./utils";

jest.mock("@ledgerhq/live-common/families/aleo/config");

const mockGetAleoCurrencyConfigById = jest.mocked(getAleoCurrencyConfigById);

describe("getAleoCurrencyConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the config when passed a CryptoCurrency", () => {
    mockGetAleoCurrencyConfigById.mockReturnValue(mockAleoCoinConfig);

    const result = getAleoCurrencyConfig(aleoCurrency);

    expect(mockGetAleoCurrencyConfigById).toHaveBeenCalledTimes(1);
    expect(mockGetAleoCurrencyConfigById).toHaveBeenCalledWith(aleoCurrency.id);
    expect(result).toBe(mockAleoCoinConfig);
  });

  it("uses parentCurrency when passed a TokenCurrency", () => {
    mockGetAleoCurrencyConfigById.mockReturnValue(mockAleoCoinConfig);

    // @ts-expect-error - not all fields are needed for this test
    const tokenCurrency: TokenCurrency = {
      type: "TokenCurrency",
      parentCurrencyId: CryptoCurrencyIdSchema.parse("aleo"),
    };

    const result = getAleoCurrencyConfig(tokenCurrency);

    expect(mockGetAleoCurrencyConfigById).toHaveBeenCalledTimes(1);
    expect(mockGetAleoCurrencyConfigById).toHaveBeenCalledWith(aleoCurrency.id);
    expect(result).toBe(mockAleoCoinConfig);
  });

  it("returns undefined when the currency is not configured", () => {
    mockGetAleoCurrencyConfigById.mockReturnValue(undefined);

    const result = getAleoCurrencyConfig(aleoCurrency);

    expect(result).toBeUndefined();
  });
});

describe("formatAleoBalances", () => {
  const unit = aleoCurrency.units[0];
  const formatConfig = { showCode: true, locale: "en-US" };

  it("returns formatted strings for all balances when privateBalance is known", () => {
    const result = formatAleoBalances({
      unit,
      formatConfig,
      balances: {
        spendableBalance: new BigNumber(1_000_000),
        transparentBalance: new BigNumber(500_000),
        privateBalance: new BigNumber(250_000),
      },
    });

    expect(result.available).toContain(unit.code);
    expect(result.transparent).toContain(unit.code);
    expect(result.private).toContain(unit.code);
  });

  it("returns placeholder for private when privateBalance is null", () => {
    const result = formatAleoBalances({
      unit,
      formatConfig,
      balances: {
        spendableBalance: new BigNumber(1_000_000),
        transparentBalance: new BigNumber(500_000),
        privateBalance: null,
      },
    });

    expect(result.private).toBe(PRIVATE_BALANCE_PLACEHOLDER);
  });
});
