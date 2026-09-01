import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
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
  useTransactionDeviceAction: () => "sign-action",
  useCompleteExchangeDeviceAction: () => "complete-action",
}));

// The account updater needs a full swap exchange to build its updaters; the
// deposit only cares about what it is told the swap is worth.
const mockGetUpdateAccountWithUpdaterParams = jest.fn((_params: unknown) => []);
jest.mock("@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams", () => ({
  getUpdateAccountWithUpdaterParams: (params: unknown) =>
    mockGetUpdateAccountWithUpdaterParams(params as never),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const depositAccount = genAccount("funding-1", { currency: ethereum, operationsSize: 0 });
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

const params = {
  depositAccount,
  receiverAccount,
  amountSent: "0.02",
  amountTo: "0.019",
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
  if (deviceStep.kind !== "device")
    throw new Error(`expected a device step, got ${deviceStep.kind}`);
  return act(async () => {
    deviceStep.withDeviceAction(binding => binding.onResult(result as never));
  });
}

function renderExecution() {
  const onDone = jest.fn();
  const onRefused = jest.fn();
  const { result } = renderHook(() => usePerpsDepositExecution(params, { onDone, onRefused }));
  return { result, onDone, onRefused };
}

/** Runs the deposit up to the coin-app signature and answers it with `signResult`. */
async function signWith(signResult: unknown) {
  mockExecuteSwap.mockImplementation(async deps => {
    await new Promise<void>((resolve, reject) => {
      deps.uiHooks["custom.exchange.swap"]({
        exchangeParams: swapUiRequest,
        onSuccess: () => resolve(),
        onCancel: reject,
      });
    });
  });

  const execution = renderExecution();
  act(() => {
    void execution.result.current.executeDeposit();
  });

  await answerDeviceStep(execution.result.current.deviceStep, {
    completeExchangeResult: { family: "ethereum", amount: new BigNumber("20000000000000000") },
  });
  await answerDeviceStep(execution.result.current.deviceStep, signResult);

  return execution;
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

  it("drives every device step and reports the deposit as done", async () => {
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

    const { result, onDone } = renderExecution();
    act(() => {
      void result.current.executeDeposit();
    });

    // Nonce: the Exchange app opens and returns a device transaction id.
    expect(result.current.deviceStep).toMatchObject({ stepId: "start" });
    await answerDeviceStep(result.current.deviceStep, {
      startExchangeResult: { nonce: "nonce-1", device: { modelId: "stax" } },
    });
    expect(onStartSuccess).toHaveBeenCalledWith("nonce-1", { modelId: "stax" });

    // Confirm, sign, broadcast: the perps confirmation screen only shows on the
    // Exchange app's payload check.
    expect(result.current.deviceStep).toMatchObject({ stepId: "confirm" });
    await answerDeviceStep(result.current.deviceStep, {
      completeExchangeResult: { family: "ethereum", amount: new BigNumber("20000000000000000") },
    });

    expect(result.current.deviceStep).toMatchObject({ stepId: "sign" });
    await answerDeviceStep(result.current.deviceStep, { signedOperation: { operation } });

    expect(mockBroadcast).toHaveBeenCalledWith({ operation });
    expect(onSwapSuccess).toHaveBeenCalledWith({ operationHash: "0xhash", swapId: "swap-1" });
    expect(onDone).toHaveBeenCalled();
  });

  it("records the swap at the quoted price, not the one the payload implies", async () => {
    await signWith({ signedOperation: { operation } });

    // The payload states its payout in the provider's own precision, so pricing
    // the history from it would misreport the deposit once it is displayed.
    expect(mockGetUpdateAccountWithUpdaterParams).toHaveBeenCalledWith(
      expect.objectContaining({ magnitudeAwareRate: new BigNumber("0.95") }),
    );
  });

  it("surfaces a failed signature instead of spinning", async () => {
    const { result, onDone, onRefused } = await signWith({
      transactionSignError: new Error("signature failed"),
    });

    expect(result.current.deviceStep).toEqual({
      kind: "error",
      error: new Error("signature failed"),
    });
    expect(onDone).not.toHaveBeenCalled();
    expect(onRefused).not.toHaveBeenCalled();
  });

  it.each([
    [
      "the coin app prompt",
      Object.assign(new Error("refused"), { name: "TransactionRefusedOnDevice" }),
    ],
    [
      "a signer naming it itself",
      Object.assign(new Error("refused"), { name: "UserRefusedOnDevice" }),
    ],
    [
      "the Exchange app's own error",
      Object.assign(new Error("User refused"), {
        name: "CompleteExchangeError",
        title: "userRefused",
      }),
    ],
  ])("reports a decline reported by %s rather than an error", async (_case, error) => {
    const { result, onDone, onRefused } = await signWith({ transactionSignError: error });

    // Declining is a decision: the caller sends the holder back to the summary,
    // so no error screen is raised here.
    expect(onRefused).toHaveBeenCalled();
    expect(result.current.deviceStep).toEqual({ kind: "processing" });
    expect(onDone).not.toHaveBeenCalled();
  });
});
