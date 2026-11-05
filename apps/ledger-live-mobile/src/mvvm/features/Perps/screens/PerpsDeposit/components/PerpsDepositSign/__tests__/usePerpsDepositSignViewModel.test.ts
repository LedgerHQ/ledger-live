import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { PayloadStepError } from "@ledgerhq/live-common/wallet-api/Exchange/SwapError";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { act, renderHook } from "@tests/test-renderer";
import type { PerpsDepositExecutionCallbacks } from "LLM/features/Perps/hooks/usePerpsDepositExecution";
import {
  usePerpsDepositSignViewModel,
  type PerpsDepositSignProps,
} from "../usePerpsDepositSignViewModel";

let capturedCallbacks: PerpsDepositExecutionCallbacks | undefined;
let mockDeviceStep: unknown = { kind: "processing" };
const mockExecuteDeposit = jest.fn();
jest.mock("LLM/features/Perps/hooks/usePerpsDepositExecution", () => ({
  usePerpsDepositExecution: (_params: unknown, callbacks: PerpsDepositExecutionCallbacks) => {
    capturedCallbacks = callbacks;
    return {
      deviceStep: mockDeviceStep,
      executeDeposit: mockExecuteDeposit,
      retry: jest.fn(),
    };
  },
}));

const ethereum = getCryptoCurrencyById("ethereum");
const depositAccount = genAccount("funding-1", { currency: ethereum, operationsSize: 0 });
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

const device = {
  deviceId: "device-1",
  deviceName: "Ledger Stax",
  modelId: "stax",
  wired: false,
} as unknown as Device;

/** The device is owned by the deposit screen, so the harness holds it the same way. */
function renderSignViewModel(initialDevice?: Device) {
  const onDone = jest.fn();
  const onRefused = jest.fn();
  const onReturnToForm = jest.fn();
  let selectedDevice = initialDevice;

  const buildProps = () =>
    ({
      depositAccount,
      receiverAccount,
      amountSent: "0.02",
      amountTo: "0.019",
      quoteId: "quote-1",
      selectedDevice,
      onSelectDevice: (next: Device | null | undefined) => {
        selectedDevice = next ?? undefined;
      },
      onDone,
      onRefused,
      onReturnToForm,
    }) as unknown as PerpsDepositSignProps;

  const { result, rerender } = renderHook(() => usePerpsDepositSignViewModel(buildProps()));

  const pickDevice = (picked: Device) => {
    act(() => {
      result.current.setSelectedDevice(picked);
      rerender(undefined);
    });
  };

  return { result, pickDevice, onDone, onRefused, onReturnToForm };
}

describe("usePerpsDepositSignViewModel", () => {
  afterEach(() => {
    mockDeviceStep = { kind: "processing" };
  });

  it("returns to the form, not the review, when the sheet of a generic error is dismissed", () => {
    mockDeviceStep = {
      kind: "error",
      error: new PayloadStepError(),
      isGeneric: true,
      returnsToForm: true,
    };
    const { result, onReturnToForm, onRefused } = renderSignViewModel(device);

    act(() => result.current.handleDrawerClose());

    expect(onReturnToForm).toHaveBeenCalledTimes(1);
    expect(onRefused).not.toHaveBeenCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallbacks = undefined;
  });

  it("waits for a device before running the deposit", () => {
    renderSignViewModel();

    expect(mockExecuteDeposit).not.toHaveBeenCalled();
  });

  it("starts the deposit once a device is picked, and only once", () => {
    const { pickDevice } = renderSignViewModel();

    pickDevice(device);
    pickDevice(device);

    expect(mockExecuteDeposit).toHaveBeenCalledTimes(1);
  });

  it("starts straight away when the screen already knows the device", () => {
    // Signing again after a decline: the device is remembered, so no list is shown.
    renderSignViewModel(device);

    expect(mockExecuteDeposit).toHaveBeenCalledTimes(1);
  });

  it("reports a decline on the device so the summary can come back", () => {
    const { onDone, onRefused } = renderSignViewModel(device);

    act(() => capturedCallbacks?.onRefused());

    expect(onRefused).toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("reports a decline of the manager prompt, which fails the connection instead", () => {
    const { result, onRefused } = renderSignViewModel(device);

    act(() =>
      result.current.onDeviceError(
        Object.assign(new Error("refused"), { name: "UserRefusedAllowManager" }),
      ),
    );

    expect(onRefused).toHaveBeenCalled();
  });

  it("leaves a connection failure to the device action, which retries in place", () => {
    const { result, onDone, onRefused } = renderSignViewModel(device);

    act(() => result.current.onDeviceError(new Error("device is locked")));

    expect(onRefused).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("reports success without reopening the summary", () => {
    const { onDone, onRefused } = renderSignViewModel(device);

    act(() => capturedCallbacks?.onDone({ swapId: "swap-1" }));

    expect(onDone).toHaveBeenCalledWith({ swapId: "swap-1" });
    expect(onRefused).not.toHaveBeenCalled();
  });
  it("hands a shortfall back to the deposit screen, which reopens the form", () => {
    const { onReturnToForm, onRefused } = renderSignViewModel(device);

    act(() => capturedCallbacks?.onReturnToForm());

    expect(onReturnToForm).toHaveBeenCalled();
    expect(onRefused).not.toHaveBeenCalled();
  });

  it("does not reopen the summary when the sheet closes after a shortfall", () => {
    const { result, onRefused } = renderSignViewModel(device);

    act(() => capturedCallbacks?.onReturnToForm());
    act(() => result.current.handleDrawerClose());

    expect(onRefused).not.toHaveBeenCalled();
  });

  it("reopens the summary when the holder closes the sheet", () => {
    const { result, onRefused } = renderSignViewModel(device);

    act(() => result.current.handleDrawerClose());

    expect(onRefused).toHaveBeenCalledTimes(1);
  });
});
