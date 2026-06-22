import BigNumber from "bignumber.js";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import {
  getAleoAddressBadgeI18nKey,
  getAleoCurrencyConfig,
  isAleoAccount,
  isAleoTransaction,
} from "./utils";

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
    expect(mockGetCurrencyConfiguration).toHaveBeenCalledWith(aleoCurrency.id);
    expect(result).toBe(mockAleoCoinConfig);
  });

  it("uses parentCurrency when passed a TokenCurrency", () => {
    mockGetCurrencyConfiguration.mockReturnValue(mockAleoCoinConfig);

    // @ts-expect-error - not all fields are needed for this test
    const tokenCurrency: TokenCurrency = {
      type: "TokenCurrency",
      parentCurrencyId: "aleo",
    };

    const result = getAleoCurrencyConfig(tokenCurrency);

    expect(mockGetCurrencyConfiguration).toHaveBeenCalledTimes(1);
    expect(mockGetCurrencyConfiguration).toHaveBeenCalledWith(aleoCurrency.id);
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
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE, "aleo.operations.type.public"],
  ])("returns the correct key for %s in from direction", (mode, expectedKey) => {
    const tx = makeAleoTransaction({ mode });

    expect(getAleoAddressBadgeI18nKey(tx, "from")).toBe(expectedKey);
  });

  it.each([
    [TRANSACTION_TYPE.TRANSFER_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.TRANSFER_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE, "aleo.operations.type.private"],
    [TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC, "aleo.operations.type.public"],
    [TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC, "aleo.operations.type.public"],
  ])("returns the correct key for %s in to direction", (mode, expectedKey) => {
    const tx = makeAleoTransaction({ mode });

    expect(getAleoAddressBadgeI18nKey(tx, "to")).toBe(expectedKey);
  });
});

describe("isAleoAccount", () => {
  it("should return true for an account with aleoResources", () => {
    const aleoAccount: AleoAccount = {
      ...ALEO_ACCOUNT_1,
      aleoResources: {
        transparentBalance: new BigNumber(0),
        privateBalance: new BigNumber(0),
        unspentPrivateRecords: [],
        provableApi: null,
        lastPrivateSyncDate: null,
      },
    };

    expect(isAleoAccount(aleoAccount)).toBe(true);
  });

  it("should return true for a plain Aleo account without aleoResources", () => {
    expect(isAleoAccount(ALEO_ACCOUNT_1)).toBe(true);
  });
});

describe("isAleoTransaction", () => {
  it("should return true for an aleo transaction", () => {
    expect(isAleoTransaction(makeAleoTransaction())).toBe(true);
  });

  it("should return false for a non-aleo transaction", () => {
    expect(
      // @ts-expect-error - testing invalid family
      isAleoTransaction({ ...makeAleoTransaction(), family: "bitcoin" }),
    ).toBe(false);
  });
});
