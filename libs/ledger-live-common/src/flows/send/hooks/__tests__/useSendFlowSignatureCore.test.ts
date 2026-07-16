/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike, Operation, SignedOperation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "../../../../coin-modules/transaction-types";
import { getMainAccount } from "../../../../account/index";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";
import { saveRecentSendRecipient } from "../../utils";
import {
  useSendFlowSignatureCore,
  type UseSendFlowSignatureCoreParams,
} from "../useSendFlowSignatureCore";

jest.mock("../../../../account/index", () => ({
  getMainAccount: jest.fn(),
}));

jest.mock("../../utils", () => ({
  saveRecentSendRecipient: jest.fn(),
}));

jest.mock("../../../../bridge/descriptor/send/features", () => ({
  sendFeatures: {
    isUserRefusedTransactionError: jest.fn(),
  },
}));

type ParamsOverrides = Omit<
  Partial<UseSendFlowSignatureCoreParams>,
  "operation" | "statusActions"
> & {
  operation?: Partial<UseSendFlowSignatureCoreParams["operation"]>;
  statusActions?: Partial<UseSendFlowSignatureCoreParams["statusActions"]>;
};

const currency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  ticker: "BTC",
} as CryptoCurrency;

const tokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usdt",
  parentCurrencyId: "ethereum",
} as TokenCurrency;

const createAccount = (): Account =>
  ({
    type: "Account",
    id: "bitcoin-account",
    name: "Bitcoin",
    currency,
  }) as unknown as Account;

const createTokenAccount = (): AccountLike =>
  ({
    type: "TokenAccount",
    id: "ethereum-account+usdt",
    token: tokenCurrency,
    parentId: "ethereum-account",
  }) as AccountLike;

const createTransaction = (overrides?: Partial<Transaction>): Transaction =>
  ({
    family: "bitcoin",
    recipient: "bc1qrecipient",
    recipientDomain: { domain: "recipient.eth" },
    ...overrides,
  }) as Transaction;

const createStatus = (): TransactionStatus =>
  ({
    errors: {},
    warnings: {},
  }) as TransactionStatus;

const createOperation = (id = "operation-id"): Operation =>
  ({
    id,
  }) as Operation;

const createSignedOperation = (): SignedOperation =>
  ({
    signature: "signed",
    operation: createOperation("signed-operation-id"),
  }) as SignedOperation;

const createParams = (overrides: ParamsOverrides = {}): UseSendFlowSignatureCoreParams => {
  const {
    operation: operationOverrides,
    statusActions: statusActionsOverrides,
    ...paramOverrides
  } = overrides;
  const operation = {
    onTransactionError: jest.fn(),
    onSigned: jest.fn(),
    onOperationBroadcasted: jest.fn(),
  };
  const statusActions = {
    resetStatus: jest.fn(),
    setError: jest.fn(),
    setSuccess: jest.fn(),
  };

  return {
    account: createAccount(),
    parentAccount: null,
    transaction: createTransaction(),
    status: createStatus(),
    currency,
    broadcast: jest.fn().mockResolvedValue(createOperation()),
    onFinish: jest.fn(),
    registerPendingOperation: jest.fn(),
    ...paramOverrides,
    operation: { ...operation, ...operationOverrides },
    statusActions: { ...statusActions, ...statusActionsOverrides },
  };
};

const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedSaveRecentSendRecipient = jest.mocked(saveRecentSendRecipient);
const mockedIsUserRefusedTransactionError = jest.mocked(sendFeatures.isUserRefusedTransactionError);

describe("useSendFlowSignatureCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMainAccount.mockImplementation(account => account as Account);
    mockedIsUserRefusedTransactionError.mockReturnValue(false);
  });

  it("should include the token currency in the signature request when account is a token account", () => {
    const account = createTokenAccount();
    const params = createParams({ account });

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    expect(result.current.request).toMatchObject({
      account,
      parentAccount: params.parentAccount,
      transaction: params.transaction,
      status: params.status,
      tokenCurrency,
    });
  });

  it("should return no signature request when account or transaction is missing", () => {
    const missingAccountParams = createParams({ account: null });
    const missingTransactionParams = createParams({ transaction: null });

    const { result: missingAccountResult } = renderHook(() =>
      useSendFlowSignatureCore(missingAccountParams),
    );
    const { result: missingTransactionResult } = renderHook(() =>
      useSendFlowSignatureCore(missingTransactionParams),
    );

    expect(missingAccountResult.current.request).toBeNull();
    expect(missingTransactionResult.current.request).toBeNull();
  });

  it("should register the pending operation when finishing with success", () => {
    const account = createAccount();
    const operation = createOperation();
    const transaction = createTransaction();
    const params = createParams({ account, transaction });

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    act(() => {
      result.current.finishWithSuccess(operation);
    });

    expect(mockedGetMainAccount).toHaveBeenCalledWith(account, undefined);
    expect(params.registerPendingOperation).toHaveBeenCalledWith(account, operation);
    expect(mockedSaveRecentSendRecipient).toHaveBeenCalledWith(
      account,
      params.parentAccount,
      transaction,
      undefined,
    );
    expect(params.operation.onOperationBroadcasted).toHaveBeenCalledWith(operation);
    expect(params.statusActions.setSuccess).toHaveBeenCalledTimes(1);
    expect(params.onFinish).toHaveBeenCalledTimes(1);
  });

  it("should pass the flow ENS name when saving the recent recipient", () => {
    const account = createAccount();
    const operation = createOperation();
    const transaction = createTransaction();
    const params = createParams({ account, transaction, recipientEnsName: "vitalik.eth" });

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    act(() => {
      result.current.finishWithSuccess(operation);
    });

    expect(mockedSaveRecentSendRecipient).toHaveBeenCalledWith(
      account,
      params.parentAccount,
      transaction,
      "vitalik.eth",
    );
  });

  it("should reset status when finishing with a user-refused error", () => {
    const error = new Error("Rejected on device");
    mockedIsUserRefusedTransactionError.mockReturnValue(true);
    const params = createParams();

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    act(() => {
      result.current.finishWithError(error);
      result.current.finishWithError(error);
    });

    expect(params.operation.onTransactionError).toHaveBeenCalledWith(error);
    expect(params.operation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(params.statusActions.resetStatus).toHaveBeenCalledTimes(1);
    expect(params.statusActions.setError).not.toHaveBeenCalled();
    expect(params.onFinish).toHaveBeenCalledTimes(1);
  });

  it("should set error when finishing with a non-user-refused error", () => {
    const error = new Error("Broadcast failed");
    const params = createParams();

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    act(() => {
      result.current.finishWithError(error);
    });

    expect(params.statusActions.setError).toHaveBeenCalledTimes(1);
    expect(params.statusActions.resetStatus).not.toHaveBeenCalled();
    expect(params.onFinish).toHaveBeenCalledTimes(1);
  });

  it("should broadcast the signed operation from a device action result", async () => {
    const signedOperation = createSignedOperation();
    const broadcastedOperation = createOperation("broadcasted-operation-id");
    const params = createParams({
      broadcast: jest.fn().mockResolvedValue(broadcastedOperation),
    });

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    act(() => {
      result.current.onDeviceActionResult({ signedOperation, device: {} });
    });

    expect(params.operation.onSigned).toHaveBeenCalledTimes(1);
    expect(params.broadcast).toHaveBeenCalledWith(signedOperation);
    await waitFor(() =>
      expect(params.operation.onOperationBroadcasted).toHaveBeenCalledWith(broadcastedOperation),
    );
    expect(params.statusActions.setSuccess).toHaveBeenCalledTimes(1);
  });

  it("should finish with an error when the device action result has no signed operation", () => {
    const params = createParams();

    const { result } = renderHook(() => useSendFlowSignatureCore(params));

    act(() => {
      result.current.onDeviceActionResult({ signedOperation: null, device: {} });
    });

    expect(params.operation.onTransactionError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Missing signed operation" }),
    );
    expect(params.broadcast).not.toHaveBeenCalled();
    expect(params.onFinish).toHaveBeenCalledTimes(1);
  });

  it("should allow finishing again after signature inputs change", () => {
    const params = createParams();
    const firstError = new Error("First error");
    const operation = createOperation();

    const { result, rerender } = renderHook(
      ({ hookParams }: { hookParams: UseSendFlowSignatureCoreParams }) =>
        useSendFlowSignatureCore(hookParams),
      { initialProps: { hookParams: params } },
    );

    act(() => {
      result.current.finishWithError(firstError);
    });

    const updatedParams = {
      ...params,
      transaction: createTransaction({ recipient: "bc1qnextrecipient" }),
    };

    rerender({ hookParams: updatedParams });

    act(() => {
      result.current.finishWithSuccess(operation);
    });

    expect(params.operation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(params.operation.onOperationBroadcasted).toHaveBeenCalledWith(operation);
    expect(params.onFinish).toHaveBeenCalledTimes(2);
  });
});
