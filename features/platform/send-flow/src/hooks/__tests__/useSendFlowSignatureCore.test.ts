/**
 * @jest-environment jsdom
 */
import type {
  SendAccount,
  SendAccountLike,
  SendOperation,
  SendSignedOperation,
  SendTransaction,
  SendTransactionStatus,
} from "../../registry";
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import {
  createMockSendFeatures,
  createSendFlowPortsWrapper,
  createTestSendFlowPorts,
} from "../../test-utils/sendFlowPorts";
import { saveRecentSendRecipient } from "../../utils";
import {
  useSendFlowSignatureCore,
  type UseSendFlowSignatureCoreParams,
} from "../useSendFlowSignatureCore";
import { SEND_FLOW_COMPLETION } from "../../types";

jest.mock("../../utils", () => ({
  saveRecentSendRecipient: jest.fn(),
}));

const mockedSendFeatures = createMockSendFeatures();
const mockedAddRecentAddress = jest.fn();
const wrapper = createSendFlowPortsWrapper(
  createTestSendFlowPorts({
    sendFeatures: mockedSendFeatures,
    addRecentAddress: mockedAddRecentAddress,
  }),
);

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

const createAccount = (): SendAccount =>
  ({
    type: "Account",
    id: "bitcoin-account",
    name: "Bitcoin",
    currency,
  }) as unknown as SendAccount;

const createTokenAccount = (): SendAccountLike =>
  ({
    type: "TokenAccount",
    id: "ethereum-account+usdt",
    token: tokenCurrency,
    parentId: "ethereum-account",
  }) as SendAccountLike;

const createTransaction = (overrides?: Partial<SendTransaction>): SendTransaction =>
  ({
    family: "bitcoin",
    recipient: "bc1qrecipient",
    recipientDomain: { domain: "recipient.eth" },
    ...overrides,
  }) as SendTransaction;

const createStatus = (): SendTransactionStatus =>
  ({
    errors: {},
    warnings: {},
  }) as SendTransactionStatus;

const createOperation = (id = "operation-id"): SendOperation =>
  ({
    id,
  }) as SendOperation;

const createSignedOperation = (): SendSignedOperation =>
  ({
    signature: "signed",
    operation: createOperation("signed-operation-id"),
  }) as SendSignedOperation;

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

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

const mockedSaveRecentSendRecipient = jest.mocked(saveRecentSendRecipient);
const mockedIsUserRefusedTransactionError = mockedSendFeatures.isUserRefusedTransactionError;

describe("useSendFlowSignatureCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsUserRefusedTransactionError.mockReturnValue(false);
  });

  it("should include the token currency in the signature request when account is a token account", () => {
    const account = createTokenAccount();
    const params = createParams({ account });

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

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

    const { result: missingAccountResult } = renderHook(
      () => useSendFlowSignatureCore(missingAccountParams),
      { wrapper },
    );
    const { result: missingTransactionResult } = renderHook(
      () => useSendFlowSignatureCore(missingTransactionParams),
      { wrapper },
    );

    expect(missingAccountResult.current.request).toBeNull();
    expect(missingTransactionResult.current.request).toBeNull();
  });

  it("should register the pending operation when finishing with success", () => {
    const account = createAccount();
    const operation = createOperation();
    const transaction = createTransaction();
    const params = createParams({ account, transaction });

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

    act(() => {
      result.current.finishWithSuccess(operation);
    });

    expect(params.registerPendingOperation).toHaveBeenCalledWith(account, operation);
    expect(mockedSaveRecentSendRecipient).toHaveBeenCalledWith(
      mockedAddRecentAddress,
      account,
      params.parentAccount,
      transaction,
      undefined,
    );
    expect(params.operation.onOperationBroadcasted).toHaveBeenCalledWith(operation);
    expect(params.statusActions.setSuccess).toHaveBeenCalledTimes(1);
    expect(params.onFinish).toHaveBeenCalledTimes(1);
    expect(params.onFinish).toHaveBeenCalledWith(SEND_FLOW_COMPLETION.SUCCESS);
  });

  it("should pass the flow ENS name when saving the recent recipient", () => {
    const account = createAccount();
    const operation = createOperation();
    const transaction = createTransaction();
    const params = createParams({ account, transaction, recipientEnsName: "vitalik.eth" });

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

    act(() => {
      result.current.finishWithSuccess(operation);
    });

    expect(mockedSaveRecentSendRecipient).toHaveBeenCalledWith(
      mockedAddRecentAddress,
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

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

    act(() => {
      result.current.finishWithError(error);
      result.current.finishWithError(error);
    });

    expect(params.operation.onTransactionError).toHaveBeenCalledWith(error);
    expect(params.operation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(params.statusActions.resetStatus).toHaveBeenCalledTimes(1);
    expect(params.statusActions.setError).not.toHaveBeenCalled();
    expect(params.onFinish).toHaveBeenCalledTimes(1);
    expect(params.onFinish).toHaveBeenCalledWith(SEND_FLOW_COMPLETION.FAILURE, error);
  });

  it("should set error when finishing with a non-user-refused error", () => {
    const error = new Error("Broadcast failed");
    const params = createParams();

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

    act(() => {
      result.current.finishWithError(error);
    });

    expect(params.statusActions.setError).toHaveBeenCalledTimes(1);
    expect(params.statusActions.resetStatus).not.toHaveBeenCalled();
    expect(params.onFinish).toHaveBeenCalledTimes(1);
    expect(params.onFinish).toHaveBeenCalledWith(SEND_FLOW_COMPLETION.FAILURE, error);
  });

  it("should broadcast the signed operation from a device action result", async () => {
    const signedOperation = createSignedOperation();
    const broadcastedOperation = createOperation("broadcasted-operation-id");
    const params = createParams({
      broadcast: jest.fn().mockResolvedValue(broadcastedOperation),
    });

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

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

  it("should present a broadcast rejection as a transaction broadcast error", async () => {
    const broadcastError = Object.assign(new Error("Insufficient funds for gas * price + value"), {
      name: "LedgerAPI4xx",
    });
    const params = createParams({
      account: { ...createAccount(), currency: { ...currency, name: "Bitcoin" } } as SendAccount,
      broadcast: jest.fn().mockRejectedValue(broadcastError),
    });

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

    act(() => {
      result.current.onDeviceActionResult({
        signedOperation: createSignedOperation(),
        device: {},
      });
    });

    await waitFor(() => expect(params.operation.onTransactionError).toHaveBeenCalledTimes(1));
    expect(params.operation.onTransactionError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "TransactionBroadcastError",
        message: broadcastError.message,
        coin: "BTC",
        networkName: "Bitcoin",
      }),
    );
    expect(params.operation.onSigned).toHaveBeenCalledTimes(1);
    expect(params.onFinish).toHaveBeenCalledWith(
      SEND_FLOW_COMPLETION.FAILURE,
      expect.objectContaining({ name: "TransactionBroadcastError" }),
    );
  });

  it("should keep a serialized network rejection retryable", async () => {
    const params = createParams({
      broadcast: jest.fn().mockRejectedValue({ name: "NetworkDown", message: "offline" }),
    });

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

    act(() => {
      result.current.onDeviceActionResult({
        signedOperation: createSignedOperation(),
        device: {},
      });
    });

    await waitFor(() => expect(params.operation.onTransactionError).toHaveBeenCalledTimes(1));
    expect(params.operation.onTransactionError).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "TransactionBroadcastError",
        message: "offline",
        retryable: true,
      }),
    );
  });

  it("should finish with an error when the device action result has no signed operation", () => {
    const params = createParams();

    const { result } = renderHook(() => useSendFlowSignatureCore(params), { wrapper });

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
      { wrapper, initialProps: { hookParams: params } },
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

  describe("when inputs change while a broadcast is pending", () => {
    const startPendingBroadcast = (overrides: ParamsOverrides = {}) => {
      const broadcastResult = createDeferred<SendOperation>();
      const params = createParams({
        ...overrides,
        broadcast: jest.fn().mockReturnValue(broadcastResult.promise),
      });
      const { result, rerender } = renderHook(
        ({ hookParams }: { hookParams: UseSendFlowSignatureCoreParams }) =>
          useSendFlowSignatureCore(hookParams),
        { wrapper, initialProps: { hookParams: params } },
      );

      act(() => {
        result.current.onDeviceActionResult({
          signedOperation: createSignedOperation(),
          device: {},
        });
      });

      return { params, broadcastResult, rerender };
    };

    it("should finish with success when a same-id account refresh lands", async () => {
      const account = createAccount();
      const broadcastedOperation = createOperation("broadcasted-operation-id");
      const { params, broadcastResult, rerender } = startPendingBroadcast({ account });

      // A background sync hands down a new account object with the same id.
      rerender({ hookParams: { ...params, account: { ...account } } });
      broadcastResult.resolve(broadcastedOperation);

      await waitFor(() =>
        expect(params.onFinish).toHaveBeenCalledWith(SEND_FLOW_COMPLETION.SUCCESS),
      );
      expect(params.operation.onOperationBroadcasted).toHaveBeenCalledWith(broadcastedOperation);
    });

    it("should finish with failure when a same-id account refresh lands", async () => {
      const account = createAccount();
      const { params, broadcastResult, rerender } = startPendingBroadcast({ account });

      rerender({ hookParams: { ...params, account: { ...account } } });
      broadcastResult.reject(new Error("Broadcast failed"));

      await waitFor(() =>
        expect(params.onFinish).toHaveBeenCalledWith(
          SEND_FLOW_COMPLETION.FAILURE,
          expect.any(Error),
        ),
      );
      expect(params.statusActions.setError).toHaveBeenCalledTimes(1);
    });

    it("should drop the outcome when the transaction is re-crafted", async () => {
      const { params, broadcastResult, rerender } = startPendingBroadcast();

      rerender({
        hookParams: {
          ...params,
          transaction: createTransaction({ recipient: "bc1qnextrecipient" }),
        },
      });
      await act(async () => {
        broadcastResult.resolve(createOperation("broadcasted-operation-id"));
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(params.operation.onOperationBroadcasted).not.toHaveBeenCalled();
      expect(params.onFinish).not.toHaveBeenCalled();
    });
  });
});
