import BigNumber from "bignumber.js";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import {
  DEFAULT_TINYBAR_FEE,
  ESTIMATED_FEE_SAFETY_RATE,
  HEDERA_OPERATION_TYPES,
  TINYBAR_SCALE,
} from "../constants";
import { estimateFees } from "./estimateFees";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getCurrencyToUSDRate } from "./utils";

jest.mock("@ledgerhq/live-countervalues/api/index");

describe("getEstimatedFees", () => {
  const mockedAccount = getMockedAccount();

  beforeEach(() => {
    jest.clearAllMocks();
    // reset LRU cache to make sure all tests receive correct mocks from mockedFetchLatest
    getCurrencyToUSDRate.clear(mockedAccount.currency.ticker);
  });

  test("returns estimated fee based on USD rate for CryptoTransfer", async () => {
    const usdRate = 1; // 1 HBAR = 1 USD
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees(
      mockedAccount.currency,
      HEDERA_OPERATION_TYPES.CryptoTransfer,
    );

    const baseFeeTinybar = 0.0001 * 10 ** TINYBAR_SCALE;
    const expectedFee = new BigNumber(baseFeeTinybar)
      .div(usdRate)
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);

    expect(result).toEqual(expectedFee);
  });

  test("returns estimated fee based on USD rate for TokenTransfer", async () => {
    const usdRate = 0.5; // 1 HBAR = 0.5 USD
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees(mockedAccount.currency, HEDERA_OPERATION_TYPES.TokenTransfer);

    const baseFeeTinybar = 0.001 * 10 ** TINYBAR_SCALE;
    const expectedFee = new BigNumber(baseFeeTinybar)
      .div(usdRate)
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);

    expect(result).toEqual(expectedFee);
  });

  test("returns estimated fee based on USD rate for TokenAssociate", async () => {
    const usdRate = 2; // 1 HBAR = 2 USD
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees(
      mockedAccount.currency,
      HEDERA_OPERATION_TYPES.TokenAssociate,
    );

    const baseFeeTinybar = 0.05 * 10 ** TINYBAR_SCALE;
    const expectedFee = new BigNumber(baseFeeTinybar)
      .div(usdRate)
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);

    expect(result).toEqual(expectedFee);
  });

  test("falls back to default estimate when cvs api returns null", async () => {
    const usdRate = null;
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees(
      mockedAccount.currency,
      HEDERA_OPERATION_TYPES.CryptoTransfer,
    );

    const expected = new BigNumber(DEFAULT_TINYBAR_FEE).multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
    expect(result).toEqual(expected);
  });

  test("falls back to default estimate on cvs api failure", async () => {
    (cvsApi.fetchLatest as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await estimateFees(
      mockedAccount.currency,
      HEDERA_OPERATION_TYPES.CryptoTransfer,
    );

    const expected = new BigNumber(DEFAULT_TINYBAR_FEE).multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
    expect(result).toEqual(expected);
  });
});
