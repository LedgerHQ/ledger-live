import React from "react";
import { act, render, waitFor } from "@tests/test-renderer";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import ExchangeDeviceDrawer from "../components/ExchangeDeviceDrawer";
import { exchangeDeviceSession } from "../session";
import type { ExchangeSessionCompleteRequest, ExchangeSessionStartRequest } from "../session";

// The Device Intent Executor drives a real device connection + bottom sheet, which cannot run in
// jest. We mock it to a marker view and capture its props, then play the part of its jobs: report
// a result and complete. That leaves the wiring under test: which intent runs when, what the
// session answers to the hooks, and when the drawer shows up and goes away.
type ExecutorProps = {
  enabled: boolean;
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  deviceInitializationInput: InitializationInput;
  intent: {
    label: string;
    input: unknown;
    onResult?: (result: unknown) => void;
  };
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
};

let mockExecutorProps: ExecutorProps | undefined;

jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    DeviceIntentExecutor: (props: ExecutorProps) => {
      mockExecutorProps = props;
      return ReactModule.createElement(View, { testID: "device-intent-executor" });
    },
  };
});

let mockInputCount = 0;
jest.mock(
  "LLM/components/DeviceIntentExecutor/ContextInitializer/utils/buildDeviceInitializationInput",
  () => ({
    buildDeviceInitializationInput: jest.fn(() =>
      Promise.resolve({ appName: "Exchange", id: ++mockInputCount }),
    ),
  }),
);

const mockBroadcast = jest.fn();
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("~/datadog", () => ({ broadcastLogger: jest.fn() }));

const manifest = { id: "swap-live-app", name: "Swap" };
// Real currencies: the session works out which apps the device needs from them.
const fromAccount = { type: "Account", id: "from", currency: getCryptoCurrencyById("bitcoin") };
const toAccount = { type: "Account", id: "to", currency: getCryptoCurrencyById("ethereum") };
const exchange = { fromAccount, fromParentAccount: undefined, toAccount };
const signedOperation = { operation: { id: "op" } } as unknown as SignedOperation;
const operation = { id: "op", hash: "0xhash" } as unknown as Operation;
const device = { deviceId: "device-1", modelId: "nanoX", wired: true };

function startRequest(overrides: Partial<ExchangeSessionStartRequest> = {}) {
  return {
    manifest,
    exchangeParams: { exchangeType: "SWAP", provider: "changelly", exchange },
    continuesOnDevice: true,
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  } as unknown as ExchangeSessionStartRequest;
}

function completeRequest(overrides: Record<string, unknown> = {}) {
  return {
    manifest,
    exchangeParams: {
      exchangeType: 0,
      provider: "changelly",
      exchange,
      transaction: { family: "bitcoin" },
      binaryPayload: "payload",
      signature: "signature",
      ...overrides,
    },
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  } as unknown as ExchangeSessionCompleteRequest;
}

function executor() {
  if (!mockExecutorProps) throw new Error("The executor is not mounted");
  return mockExecutorProps;
}

/** What a job does: report how it ended, then complete. */
function finishJob(result: unknown) {
  act(() => {
    executor().intent.onResult?.(result);
  });
  act(() => executor().onIntentJobComplete());
}

describe("WalletApiExchange feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
    mockInputCount = 0;
    exchangeDeviceSession.close();
  });

  afterEach(() => {
    exchangeDeviceSession.close();
  });

  it("shows nothing until a hook asks for the device", () => {
    const { queryByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);

    expect(queryByTestId("device-intent-executor")).toBeNull();
  });

  it("runs a swap on one drawer, from the nonce to the broadcast", async () => {
    const { getByTestId, queryByTestId } = render(
      <ExchangeDeviceDrawer manifestId={manifest.id} />,
    );
    const start = startRequest();
    const complete = completeRequest();
    mockBroadcast.mockResolvedValue(operation);

    // custom.exchange.start, called by executeSwap
    await act(() => exchangeDeviceSession.requestStart(start));

    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(executor().enabled).toBe(true);
    expect(executor().sourceFlow).toBe("swap");
    expect(executor().analyticsProperties).toEqual({
      manifestId: "swap-live-app",
      manifestName: "Swap",
    });
    expect(executor().intent.label).toBe("Start exchange");
    expect(executor().intent.input).toEqual({
      exchangeType: 0,
      provider: "changelly",
      exchange,
    });
    const initializationInput = executor().deviceInitializationInput;

    finishJob({ status: "started", nonce: "nonce-1", device });

    expect(start.onSuccess).toHaveBeenCalledWith("nonce-1", device, {});
    // The drawer stays up on its spinner while executeSwap fetches the provider payload.
    expect(getByTestId("device-intent-executor")).toBeTruthy();

    // custom.exchange.swap, once the payload is there
    await act(() => exchangeDeviceSession.requestComplete(complete));

    expect(executor().intent.label).toBe("Complete exchange");
    expect(executor().deviceInitializationInput).toBe(initializationInput);

    // The Exchange app confirmation and the coin app signature run as one job.
    finishJob({ status: "signed", signedOperation });

    await waitFor(() => expect(complete.onSuccess).toHaveBeenCalledWith(operation));
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(queryByTestId("device-intent-executor")).toBeNull();
    expect(start.onCancel).not.toHaveBeenCalled();
    expect(complete.onCancel).not.toHaveBeenCalled();
  });

  it("runs a sell as two sessions, leaving the live app free between start and complete", async () => {
    const { getByTestId, queryByTestId } = render(
      <ExchangeDeviceDrawer manifestId={manifest.id} />,
    );
    const start = startRequest({
      exchangeParams: { exchangeType: "SELL", provider: "coinify", exchange: { fromAccount } },
      continuesOnDevice: false,
    } as Partial<ExchangeSessionStartRequest>);
    const complete = completeRequest({ exchangeType: 1, exchange: { fromAccount } });
    mockBroadcast.mockResolvedValue(operation);

    // custom.exchange.start
    await act(() => exchangeDeviceSession.requestStart(start));
    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    expect(executor().intent.input).toEqual(expect.objectContaining({ exchangeType: 1 }));
    expect(executor().sourceFlow).toBe("buy/sell");
    const firstInput = executor().deviceInitializationInput;

    finishJob({ status: "started", nonce: "nonce-1", device });

    expect(start.onSuccess).toHaveBeenCalledWith("nonce-1", device, {});
    expect(queryByTestId("device-intent-executor")).toBeNull();

    // custom.exchange.complete, once the live app has the provider payload
    await act(() => exchangeDeviceSession.requestComplete(complete));
    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());

    expect(executor().intent.label).toBe("Complete exchange");
    expect(executor().sourceFlow).toBe("buy/sell");
    expect(executor().deviceInitializationInput).not.toBe(firstInput);

    finishJob({ status: "signed", signedOperation });

    await waitFor(() => expect(complete.onSuccess).toHaveBeenCalledWith(operation));
    expect(queryByTestId("device-intent-executor")).toBeNull();
  });

  it("tells the live app the swap failed, and shows the error in the same drawer", async () => {
    const { queryByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const complete = completeRequest();
    const error = new Error("payout address rejected");

    await act(() => exchangeDeviceSession.requestComplete(complete));
    const initializationInput = executor().deviceInitializationInput;
    finishJob({ status: "failed", error, deviceModelId: "nanoS" });

    expect(complete.onCancel).toHaveBeenCalledWith(error);
    expect(queryByTestId("device-intent-executor")).toBeTruthy();
    expect(executor().intent.label).toBe("Show exchange error");
    expect(executor().intent.input).toEqual(
      expect.objectContaining({ error, provider: "changelly", deviceModelId: "nanoS" }),
    );
    // Only the intent changed: the device is not prepared again.
    expect(executor().deviceInitializationInput).toBe(initializationInput);

    act(() => executor().onUserCancel());

    expect(queryByTestId("device-intent-executor")).toBeNull();
    expect(complete.onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows an error the hook reports while the drawer waits for the payload", async () => {
    const { getByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const start = startRequest();
    const error = new Error("payload not found");

    await act(() => exchangeDeviceSession.requestStart(start));
    finishJob({ status: "started", nonce: "nonce-1", device });
    expect(executor().intent.label).toBe("Start exchange");

    act(() => {
      exchangeDeviceSession.showError(manifest.id, error);
    });

    expect(getByTestId("device-intent-executor")).toBeTruthy();
    expect(executor().intent.label).toBe("Show exchange error");
    expect(executor().intent.input).toEqual({ error });
  });

  it("shows a start failure of a sell or fund, which used to go unnoticed", async () => {
    const { getByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const start = startRequest({ continuesOnDevice: false });
    const error = new Error("Incompatible AppExchange version with NG command");

    await act(() => exchangeDeviceSession.requestStart(start));
    finishJob({ status: "failed", error, device });

    expect(start.onCancel).toHaveBeenCalledWith(error, device);
    expect(getByTestId("device-intent-executor")).toBeTruthy();
    expect(executor().intent.label).toBe("Show exchange error");
  });

  it("keeps the drawer for the next start when executeSwap is going to retry", async () => {
    const { getByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const complete = completeRequest({ willRetryOnSignatureError: true });
    const error = Object.assign(new Error("Signature verification failed"), {
      name: "CompleteExchangeError",
      step: "CHECK_TRANSACTION_SIGNATURE",
      title: "signVerificationFail",
    });

    await act(() => exchangeDeviceSession.requestComplete(complete));
    const firstInput = executor().deviceInitializationInput;
    finishJob({ status: "failed", error });

    expect(complete.onCancel).toHaveBeenCalledWith(error);
    expect(getByTestId("device-intent-executor")).toBeTruthy();

    const retry = startRequest();
    await act(() => exchangeDeviceSession.requestStart(retry));

    expect(executor().intent.label).toBe("Start exchange");
    // The input changes with the intent in the same render, so the executor prepares the device.
    expect(executor().deviceInitializationInput).not.toBe(firstInput);
  });

  it("answers a refusal only once the user closes the drawer", async () => {
    const { queryByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const complete = completeRequest();

    await act(() => exchangeDeviceSession.requestComplete(complete));
    finishJob({ status: "refused" });

    expect(complete.onCancel).not.toHaveBeenCalled();
    expect(queryByTestId("device-intent-executor")).toBeTruthy();

    act(() => executor().onUserCancel());

    expect(complete.onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "TransactionRefusedOnDevice" }),
    );
    expect(queryByTestId("device-intent-executor")).toBeNull();
  });

  it("rejects the request with a closed drawer when the user dismisses a step", async () => {
    const { queryByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const start = startRequest();

    await act(() => exchangeDeviceSession.requestStart(start));
    act(() => executor().onUserCancel());

    expect(start.onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "DrawerClosedError" }),
    );
    expect(queryByTestId("device-intent-executor")).toBeNull();
  });

  it("replaces a drawer an earlier request left behind, instead of failing the new one", async () => {
    const { getByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const stale = startRequest();
    const replacement = startRequest();

    // The first request never moves on: for example the device is waiting on something else.
    await act(() => exchangeDeviceSession.requestStart(stale));
    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    const staleInput = executor().deviceInitializationInput;

    await act(() => exchangeDeviceSession.requestStart(replacement));
    await waitFor(() => expect(executor().deviceInitializationInput).not.toBe(staleInput));

    expect(stale.onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "DrawerClosedError" }),
    );
    expect(replacement.onCancel).not.toHaveBeenCalled();
    expect(getByTestId("device-intent-executor")).toBeTruthy();

    finishJob({ status: "started", nonce: "nonce-2", device });

    expect(replacement.onSuccess).toHaveBeenCalledWith("nonce-2", device, {});
  });

  it("ignores a close reported by the drawer a new request replaced", async () => {
    const { getByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const stale = startRequest();
    const replacement = startRequest();

    await act(() => exchangeDeviceSession.requestStart(stale));
    await waitFor(() => expect(getByTestId("device-intent-executor")).toBeTruthy());
    const staleDrawerClose = executor().onUserCancel;
    await act(() => exchangeDeviceSession.requestStart(replacement));
    await waitFor(() => expect(replacement.onCancel).not.toHaveBeenCalled());

    // The sheet of the first drawer reports its dismissal after the second one is up.
    act(() => staleDrawerClose());

    expect(replacement.onCancel).not.toHaveBeenCalled();
    expect(getByTestId("device-intent-executor")).toBeTruthy();
    expect(executor().intent.label).toBe("Start exchange");
  });

  it("does not show the drawer of another live app", async () => {
    const { queryByTestId } = render(<ExchangeDeviceDrawer manifestId="earn-live-app" />);

    await act(() => exchangeDeviceSession.requestStart(startRequest()));

    expect(queryByTestId("device-intent-executor")).toBeNull();
  });

  it("rejects what the exchange was waiting for when its webview goes away", async () => {
    const { unmount } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const start = startRequest();

    await act(() => exchangeDeviceSession.requestStart(start));
    unmount();

    expect(start.onCancel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "DrawerClosedError" }),
    );
    expect(exchangeDeviceSession.getSnapshot()).toBeNull();
  });

  it("still answers a broadcast that was sent when its webview goes away", async () => {
    const { unmount } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const complete = completeRequest();
    let resolveBroadcast: ((value: Operation) => void) | undefined;
    mockBroadcast.mockReturnValue(
      new Promise<Operation>(resolve => {
        resolveBroadcast = resolve;
      }),
    );

    await act(() => exchangeDeviceSession.requestComplete(complete));
    finishJob({ status: "signed", signedOperation });
    expect(mockBroadcast).toHaveBeenCalledWith(signedOperation);

    unmount();
    await act(async () => resolveBroadcast?.(operation));

    expect(complete.onCancel).not.toHaveBeenCalled();
    expect(complete.onSuccess).toHaveBeenCalledWith(operation);
  });

  it("answers a broadcast that fails with its error, and shows it", async () => {
    const { getByTestId } = render(<ExchangeDeviceDrawer manifestId={manifest.id} />);
    const complete = completeRequest();
    const error = new Error("network down");
    mockBroadcast.mockRejectedValue(error);

    await act(() => exchangeDeviceSession.requestComplete(complete));
    finishJob({ status: "signed", signedOperation });

    await waitFor(() => expect(complete.onCancel).toHaveBeenCalledWith(error));
    expect(complete.onSuccess).not.toHaveBeenCalled();
    expect(getByTestId("device-intent-executor")).toBeTruthy();
    expect(executor().intent.label).toBe("Show exchange error");
  });
});
