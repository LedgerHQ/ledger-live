import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { UserRefusedOnDevice } from "@ledgerhq/hw-transport/errors";
import { DeviceModelId } from "@ledgerhq/devices";
import type { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import type { PerpsWithdrawExecutionParams } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/execute";
import { WithdrawSubmitUnknownOutcomeError } from "@ledgerhq/live-common/wallet-api/Perps/withdraw/errors";
import { track } from "@shared/analytics";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import {
  usePerpsWithdrawSignViewModel,
  type PerpsWithdrawSignProps,
} from "../usePerpsWithdrawSignViewModel";

const mockIsBroadcastDisabled = jest.fn();
jest.mock("LLM/features/Perps/utils/isBroadcastDisabled", () => ({
  isBroadcastDisabled: () => mockIsBroadcastDisabled(),
}));

const mockExecute = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute", () => ({
  ...jest.requireActual("@ledgerhq/live-common/wallet-api/Perps/withdraw/execute"),
  executePerpsWithdraw: (params: unknown) => mockExecute(params),
}));

jest.mock("@ledgerhq/live-common/wallet-api/Perps/withdraw/request", () => ({
  getWithdrawRequestId: () => "request-1",
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

jest.mock("~/hooks/deviceActions", () => ({ useAppDeviceAction: () => ({}) }));

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
const device = { deviceId: "device-1", modelId: DeviceModelId.nanoX, wired: false };
const appResult = { device } as AppResult;

function renderViewModel() {
  const props: PerpsWithdrawSignProps = {
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
    selectedDevice: device,
    onSelectDevice: jest.fn(),
    onDone: jest.fn(),
    onRefused: jest.fn(),
    onLeave: jest.fn(),
  };
  return {
    ...renderHook(() => usePerpsWithdrawSignViewModel(props), {
      overrideInitialState: (state: State) => ({
        ...state,
        accounts: { ...state.accounts, active: [sourceAccount, destinationAccount] },
      }),
    }),
    props,
  };
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

  it("should record the submitted withdraw in the swap history of the receiving account", async () => {
    mockExecute.mockResolvedValue({ swapId: "swap-1" });
    const { result, store, props } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(props.onDone).toHaveBeenCalled());
    const receiver = store
      .getState()
      .accounts.active.find(account => account.id === destinationAccount.id);
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

  it("should sign the confirmed quote and hand the swap id over", async () => {
    mockExecute.mockImplementation(async ({ onSigned }: PerpsWithdrawExecutionParams) => {
      onSigned?.();
      return { swapId: "swap-1" };
    });
    const { result, props } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(props.onDone).toHaveBeenCalledWith({ swapId: "swap-1" }));
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
  });

  it.each([true, false])(
    "should pass the app's broadcast setting (%s) to the withdraw",
    async disabled => {
      mockIsBroadcastDisabled.mockReturnValue(disabled);
      mockExecute.mockResolvedValue({ swapId: "swap-1" });
      const { result, props } = renderViewModel();

      act(() => result.current.handleDeviceResult(appResult));

      await waitFor(() => expect(props.onDone).toHaveBeenCalled());
      expect(mockExecute).toHaveBeenCalledWith(
        expect.objectContaining({ broadcastDisabled: disabled }),
      );
    },
  );

  it("should not record a swap in the history when nothing was submitted", async () => {
    mockIsBroadcastDisabled.mockReturnValue(true);
    mockExecute.mockResolvedValue({});
    const { result, store, props } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(props.onDone).toHaveBeenCalledWith({}));
    const receiver = store
      .getState()
      .accounts.active.find(account => account.id === destinationAccount.id);
    expect(receiver?.swapHistory ?? []).toEqual([]);
  });

  it("should wait for the balance to show the withdraw before handing the swap id over", async () => {
    let reflect: () => void = () => undefined;
    mockWaitForBalance.mockImplementation(() => new Promise<void>(resolve => (reflect = resolve)));
    mockExecute.mockResolvedValue({ swapId: "swap-1" });
    const { result, props } = renderViewModel();

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
    expect(props.onDone).not.toHaveBeenCalled();

    await act(async () => reflect());
    expect(props.onDone).toHaveBeenCalledWith({ swapId: "swap-1" });
  });

  it("should go back to the summary when the withdrawal is declined on the device", async () => {
    mockExecute.mockRejectedValue(new UserRefusedOnDevice());
    const { result, props } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));

    await waitFor(() => expect(props.onRefused).toHaveBeenCalledTimes(1));
    expect(mockWaitForBalance).not.toHaveBeenCalled();
    // The sheet reports its close as well, which must not count twice.
    act(() => result.current.handleDrawerClose());
    expect(props.onRefused).toHaveBeenCalledTimes(1);
  });

  it("should keep signing when the sheet is closed mid-signature", async () => {
    let finishSigning: (result: { swapId: string }) => void = () => undefined;
    mockExecute.mockReturnValue(new Promise(resolve => (finishSigning = resolve)));
    const { result, props } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));
    act(() => result.current.handleDrawerClose());

    expect(props.onRefused).not.toHaveBeenCalled();
    await act(async () => finishSigning({ swapId: "swap-1" }));
    expect(props.onDone).toHaveBeenCalledWith({ swapId: "swap-1" });
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

  it("should end the flow when a submit with an unknown outcome is closed", async () => {
    mockExecute.mockRejectedValue(new WithdrawSubmitUnknownOutcomeError("Bad gateway"));
    const { result, props } = renderViewModel();

    act(() => result.current.handleDeviceResult(appResult));
    await waitFor(() =>
      expect(result.current.step).toMatchObject({ kind: "error", canRetry: false }),
    );

    act(() => result.current.handleDrawerClose());

    expect(props.onLeave).toHaveBeenCalled();
    expect(props.onRefused).not.toHaveBeenCalled();
  });
});
