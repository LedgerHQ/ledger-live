import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import type { JsonSafeRecord } from "../../../bridge/generic-coin-framework/types";
import type { BitcoinFamilySpecificData, Transaction } from "../types";
import { getFormattedFeeFields } from "./getFormattedFeeFields";

jest.mock("@ledgerhq/coin-module-framework/currencies/index", () => ({
  formatCurrencyUnit: jest.fn(() => "formatted"),
}));

const mockedFormatCurrencyUnit = formatCurrencyUnit as jest.Mock;

const unit = { name: "satoshi", code: "sat", magnitude: 0 };
const mainAccount = { currency: { units: [unit, { name: "bitcoin" }] } } as unknown as Account;

const transaction = (
  familySpecificData?: BitcoinFamilySpecificData,
  feeParameters?: JsonSafeRecord,
): Transaction => ({
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "",
  ...(familySpecificData ? { familySpecificData } : {}),
  ...(feeParameters ? { feeParameters } : {}),
});

describe("getFormattedFeeFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("formats the transaction fee rate in the currency's first unit", () => {
    const result = getFormattedFeeFields({
      transaction: transaction({ feePerByte: "12" }),
      mainAccount,
      locale: "fr",
    });

    expect(result).toEqual({ formattedFeeValue: "formatted" });
    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(unit, new BigNumber(12), {
      showCode: true,
      locale: "fr",
    });
  });

  it("formats the estimated fee rate (feeParameters) over the custom one", () => {
    getFormattedFeeFields({
      transaction: transaction({ feePerByte: "12" }, { feePerByte: "30" }),
      mainAccount,
      locale: "en",
    });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(unit, new BigNumber(30), {
      showCode: true,
      locale: "en",
    });
  });

  it("formats zero when the fee rate is unknown", () => {
    getFormattedFeeFields({ transaction: transaction(), mainAccount, locale: "en" });

    expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(unit, new BigNumber(0), {
      showCode: true,
      locale: "en",
    });
  });
});
