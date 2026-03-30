import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import { getAleoAddressBadgeI18nKey, getAleoCurrencyConfig } from "./utils";

jest.mock("@ledgerhq/live-common/config/index");

const mockGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);
describe("getAleoCurrencyConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the config when passed a CryptoCurrency", () => {
    mockGetCurrencyConfiguration.mockReturnValue(mockAleoCoinConfig);

    const result = getAleoCurrencyConfig(aleoCurrency);

    expect(mockGetCurrencyConfiguration).toHaveBeenCalledTimes(1);
    expect(mockGetCurrencyConfiguration).toHaveBeenCalledWith(aleoCurrency);
    expect(result).toBe(mockAleoCoinConfig);
  });

  it("uses parentCurrency when passed a TokenCurrency", () => {
    mockGetCurrencyConfiguration.mockReturnValue(mockAleoCoinConfig);

    // @ts-expect-error - not all fields are needed for this test
    const tokenCurrency: TokenCurrency = {
      type: "TokenCurrency",
      parentCurrency: aleoCurrency,
    };

    const result = getAleoCurrencyConfig(tokenCurrency);

    expect(mockGetCurrencyConfiguration).toHaveBeenCalledTimes(1);
    expect(mockGetCurrencyConfiguration).toHaveBeenCalledWith(aleoCurrency);
    expect(result).toBe(mockAleoCoinConfig);
  });

  it("returns undefined when getCurrencyConfiguration throws", () => {
    mockGetCurrencyConfiguration.mockImplementation(() => {
      throw new Error("currency not configured");
    });

    const result = getAleoCurrencyConfig(aleoCurrency);

    expect(result).toBeUndefined();
  });
});

describe("getAleoAddressBadgeI18nKey", () => {
  it.each([
    [TRANSACTION_TYPE.TRANSFER_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.TRANSFER_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, "aleo.operations.type.public"],
  ])("returns the correct key for %s in from direction", (mode, expectedKey) => {
    const tx = makeAleoTransaction({ mode });

    expect(getAleoAddressBadgeI18nKey(tx, "from")).toBe(expectedKey);
  });

  it.each([
    [TRANSACTION_TYPE.TRANSFER_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.TRANSFER_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, "aleo.operations.type.public"],
  ])("returns the correct key for %s in to direction", (mode, expectedKey) => {
    const tx = makeAleoTransaction({ mode });

    expect(getAleoAddressBadgeI18nKey(tx, "to")).toBe(expectedKey);
  });
});
