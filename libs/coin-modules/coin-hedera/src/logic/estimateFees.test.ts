import BigNumber from "bignumber.js";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import {
  DEFAULT_GAS_LIMIT,
  DEFAULT_GAS_PRICE_TINYBARS,
  DEFAULT_TINYBAR_FEE,
  ESTIMATED_FEE_SAFETY_RATE,
  ESTIMATED_GAS_SAFETY_RATE,
  HEDERA_OPERATION_TYPES,
  HEDERA_TRANSACTION_MODES,
  TINYBAR_SCALE,
} from "../constants";
import { estimateFees } from "./estimateFees";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getCurrencyToUSDRate, toEVMAddress } from "./utils";
import { apiClient } from "../network/api";
import { getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";

jest.mock("@ledgerhq/live-countervalues/api/index");
jest.mock("../network/api");

describe("getEstimatedFees", () => {
  const mockedAccount = getMockedAccount();
  const mockedTokenCurrencyERC20 = getMockedERC20TokenCurrency();
  const senderAddress = "0.0.12345";
  const recipientAddress = "0.0.67890";

  beforeEach(() => {
    jest.clearAllMocks();
    // reset LRU cache to make sure all tests receive correct mocks from mockedFetchLatest
    getCurrencyToUSDRate.clear(mockedAccount.currency.ticker);
  });

  it("returns estimated fee based on USD rate for CryptoTransfer", async () => {
    const usdRate = 1; // 1 HBAR = 1 USD
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });

    const baseFeeTinybar = 0.0001 * 10 ** TINYBAR_SCALE;
    const expectedTinybars = new BigNumber(baseFeeTinybar)
      .div(usdRate)
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
    });
  });

  it("returns estimated fee based on USD rate for TokenTransfer", async () => {
    const usdRate = 0.5; // 1 HBAR = 0.5 USD
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenTransfer,
    });

    const baseFeeTinybar = 0.001 * 10 ** TINYBAR_SCALE;
    const expectedTinybars = new BigNumber(baseFeeTinybar)
      .div(usdRate)
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
    });
  });

  it("returns estimated fee based on USD rate for TokenAssociate", async () => {
    const usdRate = 2; // 1 HBAR = 2 USD
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
    });

    const baseFeeTinybar = 0.05 * 10 ** TINYBAR_SCALE;
    const expectedTinybars = new BigNumber(baseFeeTinybar)
      .div(usdRate)
      .integerValue(BigNumber.ROUND_CEIL)
      .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
    });
  });

  it("returns estimated fee based on gas for ContractCall", async () => {
    const estimatedGasLimit = new BigNumber(50000);
    const gasPriceTinybars = new BigNumber(900);
    const transferAmount = BigInt(1000000);

    (apiClient.getNetworkFees as jest.Mock).mockResolvedValueOnce({
      fees: [
        {
          transaction_type: "ContractCall",
          gas: gasPriceTinybars.toNumber(),
        },
      ],
    });

    (apiClient.estimateContractCallGas as jest.Mock).mockResolvedValueOnce(estimatedGasLimit);

    const result = await estimateFees({
      operationType: HEDERA_OPERATION_TYPES.ContractCall,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        sender: senderAddress,
        recipient: recipientAddress,
        amount: transferAmount,
        asset: {
          type: "erc20",
          assetReference: mockedTokenCurrencyERC20.contractAddress,
        },
      },
    });

    const expectedGas = estimatedGasLimit
      .multipliedBy(ESTIMATED_GAS_SAFETY_RATE)
      .integerValue(BigNumber.ROUND_CEIL);

    const expectedTinybars = expectedGas
      .multipliedBy(gasPriceTinybars)
      .integerValue(BigNumber.ROUND_CEIL);

    expect(apiClient.getNetworkFees).toHaveBeenCalledTimes(1);
    expect(apiClient.estimateContractCallGas).toHaveBeenCalledTimes(1);
    expect(apiClient.estimateContractCallGas).toHaveBeenCalledWith(
      toEVMAddress(senderAddress),
      toEVMAddress(recipientAddress),
      mockedTokenCurrencyERC20.contractAddress,
      transferAmount,
    );
    expect(result).toMatchObject({
      tinybars: expectedTinybars,
      gas: expectedGas,
    });
  });

  it("falls back to default gas values when getNetworkFees fail", async () => {
    const transferAmount = BigInt(1000000);

    (apiClient.getNetworkFees as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await estimateFees({
      operationType: HEDERA_OPERATION_TYPES.ContractCall,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        sender: senderAddress,
        recipient: recipientAddress,
        amount: transferAmount,
        asset: {
          type: "erc20",
          assetReference: mockedTokenCurrencyERC20.contractAddress,
        },
      },
    });

    const expectedGas = DEFAULT_GAS_LIMIT;
    const expectedTinybars = new BigNumber(expectedGas)
      .multipliedBy(DEFAULT_GAS_PRICE_TINYBARS)
      .integerValue(BigNumber.ROUND_CEIL);

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
      gas: expectedGas,
    });
  });

  it("falls back to default gas values when estimateContractCallGas fail", async () => {
    const transferAmount = BigInt(1000000);

    (apiClient.getNetworkFees as jest.Mock).mockResolvedValueOnce({
      fees: [],
    });
    (apiClient.estimateContractCallGas as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const result = await estimateFees({
      operationType: HEDERA_OPERATION_TYPES.ContractCall,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        sender: senderAddress,
        recipient: recipientAddress,
        amount: transferAmount,
        asset: {
          type: "erc20",
          assetReference: mockedTokenCurrencyERC20.contractAddress,
        },
      },
    });

    const expectedGas = DEFAULT_GAS_LIMIT;
    const expectedTinybars = new BigNumber(expectedGas)
      .multipliedBy(DEFAULT_GAS_PRICE_TINYBARS)
      .integerValue(BigNumber.ROUND_CEIL);

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
      gas: expectedGas,
    });
  });

  it("falls back to default estimate when cvs api returns null", async () => {
    const usdRate = null;
    (cvsApi.fetchLatest as jest.Mock).mockResolvedValueOnce([usdRate]);

    const result = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });

    const expectedTinybars = new BigNumber(DEFAULT_TINYBAR_FEE).multipliedBy(
      ESTIMATED_FEE_SAFETY_RATE,
    );

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
    });
  });

  it("falls back to default estimate on cvs api failure", async () => {
    (cvsApi.fetchLatest as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const result = await estimateFees({
      currency: mockedAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });

    const expectedTinybars = new BigNumber(DEFAULT_TINYBAR_FEE).multipliedBy(
      ESTIMATED_FEE_SAFETY_RATE,
    );

    expect(result).toMatchObject({
      tinybars: expectedTinybars,
    });
  });
});
