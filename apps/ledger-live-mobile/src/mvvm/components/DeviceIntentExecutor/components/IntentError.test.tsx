import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { TrackScreen } from "~/analytics";
import { SourceFlowProvider } from "../utils/SourceFlowContext";
import { PAGE_DEVICE_ACTION } from "../utils/trackDeviceIntent";
import { IntentError } from "./IntentError";

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    TrackScreen: jest.fn(() => null),
  };
});

const mockedTrackScreen = jest.mocked(TrackScreen);

const device = {
  id: "device-id",
  name: "Ledger Stax",
  modelId: DMKDeviceModelId.STAX,
  sessionId: "session-id",
  type: "BLE",
  transport: "ble",
} as ConnectedDevice;

function renderState(props: Partial<React.ComponentProps<typeof IntentError>> = {}) {
  return render(
    <SourceFlowProvider value="my_ledger">
      <IntentError
        device={device}
        error={new Error("job failed")}
        onRetry={jest.fn()}
        onClose={jest.fn()}
        {...props}
      />
    </SourceFlowProvider>,
  );
}

describe("IntentError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, description and the primary Retry / secondary Close CTAs", () => {
    renderState();

    expect(screen.getByTestId("device-intent-executor-intent-error")).toBeVisible();
    expect(screen.getByText("job failed")).toBeVisible();
    expect(
      screen.getByText(
        "Something went wrong. Please retry. If the problem persists, please save your logs using the button below and provide them to Ledger Support.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Retry")).toBeVisible();
    expect(screen.getByText("Close")).toBeVisible();
  });

  it("falls back to the generic i18n title/description when the error is not translatable", () => {
    renderState({ error: "not-an-error" });

    expect(screen.getByTestId("device-intent-executor-intent-error")).toBeVisible();
    expect(screen.getByText("Unknown error")).toBeVisible();
    expect(
      screen.getByText(
        "An error occurred. Please try again or contact Ledger support if the issue persists.",
      ),
    ).toBeVisible();
  });

  it("invokes onRetry when the primary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = renderState({ onRetry, onClose });

    await user.press(screen.getByText("Retry"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("invokes onClose when the secondary CTA is pressed", async () => {
    const onRetry = jest.fn();
    const onClose = jest.fn();

    const { user } = renderState({ onRetry, onClose });

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("fires the Device Action - Unknown Intent Error page event with sourceFlow, deviceUxV2 and modelId", () => {
    renderState();

    expect(mockedTrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category: PAGE_DEVICE_ACTION.UnknownIntentError,
        sourceFlow: "my_ledger",
        deviceUxV2: true,
        modelId: DeviceModelId.stax,
      }),
      undefined,
    );
  });
});
