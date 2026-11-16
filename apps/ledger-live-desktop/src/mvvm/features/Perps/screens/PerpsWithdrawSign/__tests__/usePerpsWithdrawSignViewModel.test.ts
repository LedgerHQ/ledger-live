import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import { DeviceModelId } from "@ledgerhq/devices";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { PerpsWithdrawExecutionParams } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/execute";
import { WithdrawSubmitUnknownOutcomeError } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { track } from "@shared/analytics";
import { act, renderHook, waitFor } from "tests/testSetup";
import {
  usePerpsWithdrawSignViewModel,
  type PerpsWithdrawSignData,
} from "../usePerpsWithdrawSignViewModel";

const mockIsBroadcastDisabled = jest.fn();
jest.mock("LLD/features/Perps/utils/isBroadcastDisabled", () => ({
  isBroadcastDisabled: () => mockIsBroadcastDisabled(),
}));

const mockExecute = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute"),
  executePerpsWithdraw: (params: unknown) => mockExecute(params),
}));

const mockCancelWithdrawRequest = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/request", () => ({
  getWithdrawRequestId: () => "request-1",
  cancelWithdrawRequest: (id?: string | null) => mockCancelWithdrawRequest(id),
}));

const mockSync = jest.fn();
jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  useBridgeSync: () => mockSync,
}));

const mockWaitForBalance = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/balanceReflection", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Perps/withdraw/balanceReflection"),
  waitForWithdrawBalanceReflected: (params: unknown) => mockWaitForBalance(params),
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({}),
}));

const mockOpenPerpsWithdrawSummary = jest.fn();
jest.mock("../../PerpsWithdrawSummary/PerpsWithdrawSummaryDialog", () => ({
  openPerpsWithdrawSummary: (data: unknown) => mockOpenPerpsWithdrawSummary(data),
}));

const mockOpenPerpsTransactionSigned = jest.fn();
jest.mock("../../PerpsTransactionSigned/PerpsTransactionSignedDialog", () => ({
  openPerpsTransactionSigned: (data: unknown) => mockOpenPerpsTransactionSigned(data),
}));

const sourceAccount = genAccount("source-1", {
  currency: getCryptoCurrencyById("hypercore"),
  operationsSize: 0,
});
const destinationAccount = genAccount("eth-1", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 0,
});
const quote = {
  amountTo: new BigNumber("0.3"),
  payoutNetworkFees: new BigNumber("0.0004"),
  expiry: 0,
};
const data: PerpsWithdrawSignData = {
  sourceAccount,
  destinationAccount,
  quote,
  quoteParams: {
    amount: "10",
    sourceAccount,
    destinationAccount,
    accounts: [sourceAccount, destinationAccount],
    counterValueCurrency: "USD",
  },
  draft: { picked: { account: destinationAccount }, amountText: "10" },
};
const device = { deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false };
const appResult = { device } as AppResult;

function renderViewModel() {
  const onClose = jest.fn();
  const hook = renderHook(() => usePerpsWithdrawSignViewModel(data, onClose), {
    initialState: { accounts: [sourceAccount, destinationAccount] },
  });
  return { ...hook, onClose };
}

describe("usePerpsWithdrawSignViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBroadcastDisabled.mockReturnValue(false);
    mockWaitForBalance.mockResolvedValue("reflected");
  });

  it("should connect to the Ethereum app first", () => {
    const { result } = renderViewModel();

    expect(result.current.step).toEqual({ kind: "connect" });
    expect(result.current.request).toEqual({ appName: "Ethereum" });
  });

  it("should sign the confirmed quote and show the transaction signed screen", async () => {
    mockExecute.mockImplementation(async ({ onSigned }: PerpsWithdrawExecutionParams) => {
      onSigned?.();
      return { swapId: "swap-1" };
    });
    const { result, onClose } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "request-1",
        device,
        sourceAccount,
        quote,
        result: { amountFrom: "10", amountTo: "0.3", toCurrencyId: "ethereum" },
        targetCurrency: "ETH",
        track,
      }),
    );
    expect(mockOpenPerpsTransactionSigned).toHaveBeenCalledWith({
      receiveCurrencyTicker: "ETH",
      swapId: "swap-1",
      provider: "swapkit_hyperliquid",
    });
  });

  it("should record the submitted withdraw in the swap history of the receiving account", async () => {
    mockExecute.mockResolvedValue({ swapId: "swap-1" });
    const { result, store, onClose } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const receiver = store.getState().accounts.find(a => a.id === destinationAccount.id);
    expect(receiver?.swapHistory).toEqual([
      expect.objectContaining({
        swapId: "swap-1",
        provider: "swapkit_hyperliquid",
        status: "pending",
        fromAccountId: sourceAccount.id,
        operationId: "",
      }),
    ]);
  });

  it.each([true, false])(
    "should pass the app's broadcast setting (%s) to the withdraw",
    async disabled => {
      mockIsBroadcastDisabled.mockReturnValue(disabled);
      mockExecute.mockResolvedValue({ swapId: "swap-1" });
      const { result, onClose } = renderViewModel();

      act(() => result.current.handleDeviceResult(appResult));

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({ broadcastDisabled: disabled }),
      );
    },
  );

  it("should open the transaction signed screen without a swap id when nothing was submitted", async () => {
    mockIsBroadcastDisabled.mockReturnValue(true);
    mockExecute.mockResolvedValue({});
    const { result, store, onClose } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockOpenPerpsTransactionSigned).toHaveBeenCalledWith({
      receiveCurrencyTicker: "ETH",
      swapId: undefined,
      provider: "swapkit_hyperliquid",
    });
    const receiver = store.getState().accounts.find(a => a.id === destinationAccount.id);
    expect(receiver?.swapHistory ?? []).toEqual([]);
  });

  it("should wait for the balance to show the withdraw before the transaction signed screen", async () => {
    let reflect: () => void = () => undefined;
    mockWaitForBalance.mockImplementation(() => new Promise<void>(resolve => (reflect = resolve)));
    mockExecute.mockResolvedValue({ swapId: "swap-1" });
    const { result } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(mockWaitForBalance).toHaveBeenCalled());
    const [params] = mockWaitForBalance.mock.lastCall;
    // 10 USDC lower: a smaller drop, e.g. from trading, does not count.
    expect(params.targetBalance).toEqual(sourceAccount.spendableBalance.minus(10_000_000));
    params.syncAccount();
    expect(mockSync).toHaveBeenCalledWith({
      type: "SYNC_ONE_ACCOUNT",
      accountId: sourceAccount.id,
      priority: 10,
      reason: "perps-withdraw",
    });
    expect(mockOpenPerpsTransactionSigned).not.toHaveBeenCalled();

    await act(async () => reflect());
    expect(mockOpenPerpsTransactionSigned).toHaveBeenCalled();
  });

  it("should reopen the summary when the withdrawal is declined on the device", async () => {
    mockExecute.mockRejectedValue(new UserRefusedOnDevice());
    const { result, onClose } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(mockOpenPerpsWithdrawSummary).toHaveBeenCalledWith(data));
    expect(onClose).toHaveBeenCalled();
    expect(mockWaitForBalance).not.toHaveBeenCalled();
  });

  it("should let a device error be retried from the device connection", async () => {
    mockExecute.mockRejectedValue(new Error("Locked device"));
    const { result } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));
    await waitFor(() => expect(result.current.step).toMatchObject({ canRetry: true }));

    act(() => result.current.retry());

    expect(result.current.step).toEqual({ kind: "connect" });
    expect(result.current.attempt).toBe(1);
  });

  it("should never retry a submit whose outcome is unknown", async () => {
    mockExecute.mockRejectedValue(new WithdrawSubmitUnknownOutcomeError("Bad gateway"));
    const { result } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() =>
      expect(result.current.step).toMatchObject({ kind: "error", canRetry: false }),
    );
  });

  it("should end this withdrawal request when dismissed", () => {
    const { result, onClose } = renderViewModel();

    act(() => result.current.onDismiss());

    expect(mockCancelWithdrawRequest).toHaveBeenCalledWith("request-1");
    expect(onClose).toHaveBeenCalled();
  });
});
