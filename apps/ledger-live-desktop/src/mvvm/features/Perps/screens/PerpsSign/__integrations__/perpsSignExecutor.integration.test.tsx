import React from "react";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { HyperliquidSignIntent } from "@features/platform-hyperliquid-sign-intent";
import { act, render, screen, withFlagOverrides } from "tests/testSetup";
import PerpsSignRoot, { openPerpsSign } from "../PerpsSignDialog";

// The executor drives a real device connection, which cannot run in jest. It is stood in for by
// a marker capturing its props, so this test covers the Perps wiring around it.
type ExecutorProps = {
  sourceFlow: string;
  intent: HyperliquidSignIntent;
  deviceInitializationInput: unknown;
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
};

let mockExecutorProps: ExecutorProps | undefined;

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Hyperliquid" })),
  DeviceIntentExecutor: (props: ExecutorProps) => {
    mockExecutorProps = props;
    return <div data-testid="device-intent-executor" />;
  },
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: () => <div data-testid="device-action" />,
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: () => ({ connectApp: jest.fn() }),
}));

const SIGNATURES = [{ r: "0xr", s: "0xs", v: 27 }];

function makeRequest() {
  return {
    appName: "Hyperliquid",
    signFactory: jest.fn(),
    signOnSession: jest.fn().mockResolvedValue({ signatures: SIGNATURES }),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
  };
}

const renderWithDeviceIntentSign = () =>
  render(<PerpsSignRoot />, {
    initialState: withFlagOverrides({ ptxPerpsDeviceIntentSign: { enabled: true } }),
  });

describe("PerpsSign with the device intent executor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
  });

  it("mounts the executor instead of the legacy device action", async () => {
    renderWithDeviceIntentSign();

    act(() => openPerpsSign(makeRequest()));

    expect(await screen.findByTestId("device-intent-executor")).toBeInTheDocument();
    expect(screen.queryByTestId("device-action")).not.toBeInTheDocument();
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_api");
    expect(mockExecutorProps?.deviceInitializationInput).toEqual({ appName: "Hyperliquid" });
  });

  it("answers the live app with the signatures and closes", async () => {
    const request = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(request));
    await screen.findByTestId("device-intent-executor");

    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "signed", signatures: SIGNATURES });
      mockExecutorProps!.onIntentJobComplete();
    });

    expect(request.onSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("answers the live app with a refusal when the user closes the dialog", async () => {
    const request = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(request));
    await screen.findByTestId("device-intent-executor");

    act(() => mockExecutorProps!.onUserCancel());

    expect(request.onError).toHaveBeenCalledWith(expect.any(UserRefusedOnDevice));
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("answers the previous request with a refusal when a newer one replaces it", async () => {
    const first = makeRequest();
    const second = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(first));
    await screen.findByTestId("device-intent-executor");

    act(() => openPerpsSign(second));

    expect(first.onError).toHaveBeenCalledWith(expect.any(UserRefusedOnDevice));
    expect(second.onError).not.toHaveBeenCalled();
  });

  it("keeps the legacy device action when the flag is off", () => {
    render(<PerpsSignRoot />);

    act(() => openPerpsSign(makeRequest()));

    expect(screen.getByTestId("device-action")).toBeVisible();
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });
});
