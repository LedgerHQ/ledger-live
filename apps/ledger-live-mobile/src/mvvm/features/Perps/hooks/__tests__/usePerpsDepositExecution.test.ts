import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, renderHook } from "@tests/test-renderer";
import { usePerpsDepositExecution, type PerpsDepositDeviceStep } from "../usePerpsDepositExecution";

const mockExecuteSwap = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Exchange/executeSwap", () => ({
  executeSwap: (deps: unknown, params: unknown) => mockExecuteSwap(deps, params),
}));

const mockBroadcast = jest.fn();
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));

jest.mock("~/hooks/deviceActions", () => ({
  useStartExchangeDeviceAction: () => "start-action",
  useCompleteExchangeDeviceAction: () => "complete-action",
  useTransactionDeviceAction: () => "sign-action",
}));

// The account updater needs a full swap exchange to build its updaters; the
// deposit only cares that the broadcast reached the caller.
jest.mock("@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams", () => ({
  getUpdateAccountWithUpdaterParams: () => [],
}));

function createAccount(id: string, currencyId: string): AccountLike {
  return {
    type: "Account",
    id,
    currency: getCryptoCurrencyById(currencyId),
    spendableBalance: new BigNumber(0),
    balance: new BigNumber(0),
  } as AccountLike;
}

const depositAccount = createAccount("funding-1", "ethereum");
const receiverAccount = createAccount("receiver-1", "ethereum");

const params = {
  depositAccount,
  receiverAccount,
  amountSent: { value: "0.02", currencyId: "ethereum" },
  amountTo: { value: "0.019", currencyId: "ethereum" },
  quoteId: "quote-1",
};

const swapUiRequest = {
  provider: "swapkit_hyperliquid",
  transaction: { family: "ethereum" },
  binaryPayload: "payload",
  signature: "signature",
  exchange: { fromAccount: depositAccount, toAccount: receiverAccount },
  swapId: "swap-1",
  magnitudeAwareRate: new BigNumber(1),
};

const operation = { id: "operation-1", hash: "0xhash" };

/** Answers the device action the hook is currently waiting on. */
function answerDeviceStep(deviceStep: PerpsDepositDeviceStep, result: unknown) {
  if (deviceStep.kind !== "device") {
    throw new Error(`expected a device step, got ${deviceStep.kind}`);
  }
  return act(async () => {
    deviceStep.withDeviceAction(binding => binding.onResult(result as never));
  });
}

function renderExecution(onSigned = jest.fn()) {
  const { result } = renderHook(() => usePerpsDepositExecution(params, onSigned));
  return { result, onSigned };
}

describe("usePerpsDepositExecution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBroadcast.mockResolvedValue(operation);
  });

  it("quotes the deposit as a swap against the perps provider, at the price the review showed", async () => {
    mockExecuteSwap.mockResolvedValue({ operationHash: operation.hash, swapId: "swap-1" });
    const { result } = renderExecution();

    await act(async () => {
      await result.current.executeDeposit();
    });

    expect(mockExecuteSwap).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        exchangeType: "SWAP",
        provider: "swapkit_hyperliquid",
        fromAmount: "0.02",
        fromAmountAtomic: new BigNumber("20000000000000000"),
        quoteId: "quote-1",
        feeStrategy: "medium",
      }),
    );
  });

  it("drives every device step and reports the signed deposit", async () => {
    const onStartSuccess = jest.fn();
    const onSwapSuccess = jest.fn();
    mockExecuteSwap.mockImplementation(async deps => {
      const nonce = await new Promise<string>((resolve, reject) =>
        deps.uiHooks["custom.exchange.start"]({
          exchangeParams: { exchangeType: "SWAP", provider: "swapkit_hyperliquid", exchange: {} },
          onSuccess: (...args: unknown[]) => {
            onStartSuccess(...args);
            resolve(args[0] as string);
          },
          onCancel: reject,
        }),
      );
      expect(nonce).toBe("nonce-1");

      await new Promise<void>((resolve, reject) =>
        deps.uiHooks["custom.exchange.swap"]({
          exchangeParams: swapUiRequest,
          onSuccess: (...args: unknown[]) => {
            onSwapSuccess(...args);
            resolve();
          },
          onCancel: reject,
        }),
      );
    });

    const { result, onSigned } = renderExecution();
    act(() => {
      void result.current.executeDeposit();
    });

    // Nonce: the Exchange app opens and returns a device transaction id.
    expect(result.current.deviceStep).toMatchObject({ stepId: "start" });
    await answerDeviceStep(result.current.deviceStep, {
      startExchangeResult: { nonce: "nonce-1", device: { modelId: "stax" } },
    });
    expect(onStartSuccess).toHaveBeenCalledWith("nonce-1", { modelId: "stax" });

    expect(result.current.deviceStep).toMatchObject({ stepId: "confirm" });
    await answerDeviceStep(result.current.deviceStep, {
      completeExchangeResult: { family: "ethereum" },
    });

    expect(result.current.deviceStep).toMatchObject({ stepId: "sign" });
    await answerDeviceStep(result.current.deviceStep, { signedOperation: { operation } });

    expect(mockBroadcast).toHaveBeenCalledWith({ operation });
    expect(onSwapSuccess).toHaveBeenCalledWith({ operationHash: "0xhash", swapId: "swap-1" });
    expect(onSigned).toHaveBeenCalledWith({
      operationId: "operation-1",
      accountId: "funding-1",
      receiveCurrencyTicker: "ETH",
      swapId: "swap-1",
    });
  });

  it("surfaces a refused signature instead of spinning", async () => {
    mockExecuteSwap.mockImplementation(async deps => {
      await new Promise<void>((resolve, reject) => {
        deps.uiHooks["custom.exchange.swap"]({
          exchangeParams: swapUiRequest,
          onSuccess: () => resolve(),
          onCancel: reject,
        });
      });
    });

    const { result, onSigned } = renderExecution();
    act(() => {
      void result.current.executeDeposit();
    });

    await answerDeviceStep(result.current.deviceStep, {
      completeExchangeResult: { family: "ethereum" },
    });
    await answerDeviceStep(result.current.deviceStep, {
      transactionSignError: new Error("refused on device"),
    });

    expect(result.current.deviceStep).toEqual({
      kind: "error",
      error: new Error("refused on device"),
    });
    expect(onSigned).not.toHaveBeenCalled();
  });
});
