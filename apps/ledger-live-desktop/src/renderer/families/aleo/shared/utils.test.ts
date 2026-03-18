import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { AleoCoinConfig } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import { getAleoCurrencyConfig, getAleoTransactionTypeLabelKey } from "./utils";

jest.mock("@ledgerhq/live-common/config/index");

const mockGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);

const mockAleoCoinConfig: AleoCoinConfig = {
  status: { type: "active" },
  networkType: "mainnet",
  apiUrls: { node: "https://node.aleo.org", sdk: "https://sdk.aleo.org" },
  feeByTransactionType: {
    [TRANSACTION_TYPE.TRANSFER_PUBLIC]: 1000,
    [TRANSACTION_TYPE.TRANSFER_PRIVATE]: 2000,
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE]: 3000,
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC]: 4000,
  },
  feeSafetyMultiplier: 1.5,
  isFeeSponsored: false,
};

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

describe("getAleoTransactionTypeLabelKey", () => {
  it.each([
    [TRANSACTION_TYPE.TRANSFER_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.TRANSFER_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, "aleo.operations.type.public"],
  ])("returns the correct label key for a %s transaction", (mode, expectedKey) => {
    const tx = makeAleoTransaction({ mode });

    expect(getAleoTransactionTypeLabelKey(tx)).toBe(expectedKey);
  });
});
