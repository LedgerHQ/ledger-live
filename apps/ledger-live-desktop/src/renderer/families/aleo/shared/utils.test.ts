import BigNumber from "bignumber.js";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { aleoCurrency } from "../__mocks__/currency.mock";
import { makeAleoTransaction } from "../__mocks__/transaction.mock";
import {
  getAleoAddressBadgeI18nKey,
  getAleoCurrencyConfig,
  isAleoAccount,
  isAleoTransaction,
  applyAleoBalanceSourceChange,
  formatAleoBalances,
} from "./utils";
import { PRIVATE_BALANCE_PLACEHOLDER } from "../constants";

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

  it("should return true for token account", () => {
    expect(isAleoAccount(ALEO_TOKEN_ACCOUNT)).toBe(true);
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

describe("applyAleoBalanceSourceChange", () => {
  it.each([
    [
      "native send to public",
      TRANSACTION_TYPE.TRANSFER_PUBLIC,
      "public",
      makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
      false,
    ],
    [
      "native send to private",
      TRANSACTION_TYPE.TRANSFER_PRIVATE,
      "private",
      makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC }),
      true,
    ],
    [
      "native self-transfer to public",
      TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
      "public",
      makeAleoTransaction({ mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE }),
      false,
    ],
    [
      "native self-transfer to private",
      TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
      "private",
      makeAleoTransaction({ mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE }),
      true,
    ],
    [
      "token send to public",
      TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
      "public",
      makeAleoTransaction({
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
        subAccountId: ALEO_TOKEN_ACCOUNT.id,
      }),
      false,
    ],
    [
      "token send to private",
      TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
      "private",
      makeAleoTransaction({
        mode: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
        subAccountId: ALEO_TOKEN_ACCOUNT.id,
      }),
      true,
    ],
    [
      "token self-transfer to public",
      TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
      "public",
      makeAleoTransaction({
        mode: TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
        subAccountId: ALEO_TOKEN_ACCOUNT.id,
      }),
      false,
    ],
    [
      "token self-transfer to private",
      TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
      "private",
      makeAleoTransaction({
        mode: TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
        subAccountId: ALEO_TOKEN_ACCOUNT.id,
      }),
      true,
    ],
  ] as const)(
    "%s sets mode to %s and %s properties",
    (_label, expectedMode, source, transaction, expectProperties) => {
      const result = applyAleoBalanceSourceChange(transaction, source);

      expect(result.mode).toBe(expectedMode);

      if (expectProperties) {
        expect(result.properties).toEqual({
          amountRecordCommitments: [],
          feeRecordCommitment: null,
        });
      } else {
        expect(result).not.toHaveProperty("properties");
      }
    },
  );
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
