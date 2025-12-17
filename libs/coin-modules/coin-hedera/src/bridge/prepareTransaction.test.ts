import BigNumber from "bignumber.js";
import { estimateFees } from "../logic/estimateFees";
import { prepareTransaction } from "./prepareTransaction";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import * as utils from "./utils";
import type { EstimateFeesResult } from "../types";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
} from "../test/fixtures/currency.fixture";

jest.mock("../logic/estimateFees");

describe("prepareTransaction", () => {
  const mockAccount = getMockedAccount();
  const mockTx = getMockedTransaction();
  const mockFeeEstimation: EstimateFeesResult = {
    tinybars: new BigNumber(10),
    gas: new BigNumber(5),
  };
  const mockCalculatedAmount = {
    amount: new BigNumber(100),
    totalSpent: new BigNumber(100),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (estimateFees as jest.Mock).mockResolvedValue(mockFeeEstimation);
    jest.spyOn(utils, "calculateAmount").mockResolvedValue(mockCalculatedAmount);
  });

  it("should set amount and maxFee from utils", async () => {
    const result = await prepareTransaction(mockAccount, mockTx);

    expect(result.amount).toStrictEqual(new BigNumber(100));
    expect(result.maxFee).toStrictEqual(new BigNumber(10));
  });

  it("should build ContractCall estimation params with txIntent", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const tokenAccount = getMockedTokenAccount(mockTokenERC20);
    const accountWithToken = getMockedAccount({ subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Send,
      subAccountId: tokenAccount.id,
      amount: new BigNumber(5000),
      recipient: "0.0.9999",
    });

    await prepareTransaction(accountWithToken, transaction);

    expect(estimateFees).toHaveBeenCalledWith({
      operationType: HEDERA_OPERATION_TYPES.ContractCall,
      txIntent: {
        intentType: "transaction",
        type: HEDERA_TRANSACTION_MODES.Send,
        asset: {
          type: mockTokenERC20.tokenType,
          assetReference: mockTokenERC20.contractAddress,
          assetOwner: accountWithToken.freshAddress,
        },
        amount: BigInt(5000),
        sender: accountWithToken.freshAddress,
        recipient: transaction.recipient,
      },
    });
  });

  it("should set gasLimit for ERC20 transactions when gas is estimated", async () => {
    const mockTokenERC20 = getMockedERC20TokenCurrency();
    const tokenAccount = getMockedTokenAccount(mockTokenERC20);
    const accountWithToken = getMockedAccount({ subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Send,
      subAccountId: tokenAccount.id,
    });

    const result = await prepareTransaction(accountWithToken, transaction);

    expect(result).toMatchObject({
      gasLimit: mockFeeEstimation.gas,
    });
  });

  it("should use TokenTransfer operation type for HTS tokens", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const tokenAccount = getMockedTokenAccount(mockTokenHTS);
    const accountWithToken = getMockedAccount({ subAccounts: [tokenAccount] });
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Send,
      subAccountId: tokenAccount.id,
    });

    await prepareTransaction(accountWithToken, transaction);

    expect(estimateFees).toHaveBeenCalledWith({
      currency: accountWithToken.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenTransfer,
    });
  });

  it("should use TokenAssociate operation type", async () => {
    const mockTokenHTS = getMockedHTSTokenCurrency();
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
      properties: {
        token: mockTokenHTS,
      },
    });

    await prepareTransaction(mockAccount, transaction);

    expect(estimateFees).toHaveBeenCalledWith({
      currency: mockAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
    });
  });

  it("should use CryptoTransfer operation type for native transfers", async () => {
    const transaction = getMockedTransaction({
      mode: HEDERA_TRANSACTION_MODES.Send,
      amount: new BigNumber(1000000),
      recipient: "0.0.12345",
    });

    await prepareTransaction(mockAccount, transaction);

    expect(estimateFees).toHaveBeenCalledWith({
      currency: mockAccount.currency,
      operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
    });
  });
});
