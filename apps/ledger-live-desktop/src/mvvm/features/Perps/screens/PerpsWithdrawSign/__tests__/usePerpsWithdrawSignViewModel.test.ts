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
  beforeEach(() => jest.clearAllMocks());

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

  it("should reopen the summary when the withdrawal is declined on the device", async () => {
    mockExecute.mockRejectedValue(new UserRefusedOnDevice());
    const { result, onClose } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(mockOpenPerpsWithdrawSummary).toHaveBeenCalledWith(data));
    expect(onClose).toHaveBeenCalled();
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
