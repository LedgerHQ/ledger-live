import React, { useEffect } from "react";
import { useNavigate, type NavigateFunction } from "react-router";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type { HyperliquidSignIntent } from "@features/platform-intent-hyperliquid-sign";
import { act, render, screen, withFlagOverrides } from "tests/testSetup";
import PerpsSignRoot, { openPerpsSign } from "../PerpsSignDialog";

type ExecutorProps = {
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  deviceConnectionParams: DeviceConnectionParams;
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
const MANIFEST = { manifestId: "perps-live-app", manifestName: "Perps" };

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

let navigate: NavigateFunction;
function LocationObserver() {
  const nav = useNavigate();
  useEffect(() => {
    navigate = nav;
  }, [nav]);
  return null;
}

const renderWithDeviceIntentSign = () =>
  render(
    <>
      <LocationObserver />
      <PerpsSignRoot />
    </>,
    {
      initialState: withFlagOverrides({ ptxPerpsDeviceIntentSign: { enabled: true } }),
    },
  );

describe("PerpsSign with the device intent executor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecutorProps = undefined;
  });

  it("should mount the executor with manifest analytics and Nano S excluded", async () => {
    renderWithDeviceIntentSign();

    act(() => openPerpsSign(makeRequest(), MANIFEST));

    expect(await screen.findByTestId("device-intent-executor")).toBeVisible();
    expect(screen.queryByTestId("device-action")).not.toBeInTheDocument();
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_api");
    expect(mockExecutorProps?.analyticsProperties).toEqual(MANIFEST);
    expect(mockExecutorProps?.deviceConnectionParams.acceptedDeviceModelIds).not.toContain(
      DeviceModelId.NANO_S,
    );
    expect(mockExecutorProps?.deviceInitializationInput).toEqual({ appName: "Hyperliquid" });
  });

  it("should answer the live app with the signatures and close", async () => {
    const request = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(request, MANIFEST));
    await screen.findByTestId("device-intent-executor");

    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "signed", signatures: SIGNATURES });
      mockExecutorProps!.onIntentJobComplete();
    });

    expect(request.onSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("should answer the live app with the device refusal and close, leaving the outcome screen to it", async () => {
    const request = makeRequest();
    const refusal = new UserRefusedOnDevice();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(request, MANIFEST));
    await screen.findByTestId("device-intent-executor");

    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "refused", error: refusal });
      mockExecutorProps!.onIntentJobComplete();
    });

    expect(request.onError).toHaveBeenCalledWith(refusal);
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("should cancel the request when the user closes the dialog", async () => {
    const request = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(request, MANIFEST));
    await screen.findByTestId("device-intent-executor");

    act(() => mockExecutorProps!.onUserCancel());

    expect(request.onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("should cancel the previous request when a newer one replaces it", async () => {
    const first = makeRequest();
    const second = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(first, MANIFEST));
    await screen.findByTestId("device-intent-executor");

    act(() => openPerpsSign(second, MANIFEST));

    expect(first.onCancel).toHaveBeenCalled();
    expect(first.onSuccess).not.toHaveBeenCalled();
    expect(second.onCancel).not.toHaveBeenCalled();
  });

  it("should cancel a request replaced before its executor renders", async () => {
    const first = makeRequest();
    const second = makeRequest();
    renderWithDeviceIntentSign();

    act(() => {
      openPerpsSign(first, MANIFEST);
      openPerpsSign(second, MANIFEST);
    });
    await screen.findByTestId("device-intent-executor");

    expect(first.onCancel).toHaveBeenCalledTimes(1);
    expect(second.onCancel).not.toHaveBeenCalled();
    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "signed", signatures: SIGNATURES });
      mockExecutorProps!.onIntentJobComplete();
    });
    expect(second.onSuccess).toHaveBeenCalledWith({ signatures: SIGNATURES });
    expect(first.onSuccess).not.toHaveBeenCalled();
  });

  it("should close the executor and cancel the request when navigating away", async () => {
    const request = makeRequest();
    renderWithDeviceIntentSign();
    act(() => openPerpsSign(request, MANIFEST));
    await screen.findByTestId("device-intent-executor");

    act(() => {
      navigate("/manager?q=Hyperliquid");
    });

    expect(request.onCancel).toHaveBeenCalled();
    expect(request.onSuccess).not.toHaveBeenCalled();
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });

  it("should keep the legacy device action when the flag is off", () => {
    render(<PerpsSignRoot />);

    act(() => openPerpsSign(makeRequest()));

    expect(screen.getByTestId("device-action")).toBeVisible();
    expect(screen.queryByTestId("device-intent-executor")).not.toBeInTheDocument();
  });
});
