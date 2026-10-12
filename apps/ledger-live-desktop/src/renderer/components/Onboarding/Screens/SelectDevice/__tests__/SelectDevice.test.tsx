import React from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, withFlagOverrides } from "tests/testSetup";

const mockNavigate = jest.fn();

jest.mock("LLD/features/Onboarding/components/CounterfeitWarningDialog", () => ({
  __esModule: true,
  default: ({
    open,
    deviceModelId,
    onProceed,
    onDismiss,
  }: {
    open: boolean;
    deviceModelId: string;
    onProceed: () => void;
    onDismiss: () => void;
  }) =>
    open ? (
      <div data-testid="counterfeit-warning-dialog" data-device-model-id={deviceModelId}>
        <button type="button" data-testid="counterfeit-warning-continue" onClick={onProceed} />
        <button type="button" data-testid="counterfeit-warning-close" onClick={onDismiss} />
      </div>
    ) : null,
}));

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../../index", () => {
  const { createContext } = jest.requireActual<typeof import("react")>("react");
  return {
    OnboardingContext: createContext<{
      deviceModelId: DeviceModelId | null;
      setDeviceModelId: (id: DeviceModelId | null) => void;
    }>({
      deviceModelId: null,
      setDeviceModelId: () => {},
    }),
  };
});

import { OnboardingContext } from "../../../index";
import { SelectDevice } from "../index";

const renderSelectDevice = (featureFlags: Parameters<typeof withFlagOverrides>[0] = {}) => {
  const setDeviceModelId = jest.fn();

  const view = render(
    <OnboardingContext.Provider value={{ deviceModelId: null, setDeviceModelId }}>
      <SelectDevice />
    </OnboardingContext.Provider>,
    {
      initialState: withFlagOverrides({ supportDeviceApex: { enabled: true }, ...featureFlags }),
    },
  );

  return { ...view, setDeviceModelId };
};

const TOUCHSCREEN_WARNING_ON = {
  lwdOnboardingCounterfeitWarningTouchscreens: { enabled: true },
};

describe("SelectDevice counterfeit warning gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([DeviceModelId.stax, DeviceModelId.europa, DeviceModelId.apex])(
    "should show the dialog on %s when the touchscreen flag is on",
    async deviceModelId => {
      const { user } = renderSelectDevice(TOUCHSCREEN_WARNING_ON);

      await user.click(screen.getByTestId(`v3-device-${deviceModelId}`));

      expect(screen.getByTestId("counterfeit-warning-dialog")).toHaveAttribute(
        "data-device-model-id",
        deviceModelId,
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    },
  );

  it("should go to the sync onboarding after continuing from the dialog", async () => {
    const { user } = renderSelectDevice(TOUCHSCREEN_WARNING_ON);

    await user.click(screen.getByTestId(`v3-device-${DeviceModelId.stax}`));
    await user.click(screen.getByTestId("counterfeit-warning-continue"));

    expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(`/onboarding/sync/${DeviceModelId.stax}`);
  });

  it("should stay on device selection after closing the dialog", async () => {
    const { user } = renderSelectDevice(TOUCHSCREEN_WARNING_ON);

    await user.click(screen.getByTestId(`v3-device-${DeviceModelId.stax}`));
    await user.click(screen.getByTestId("counterfeit-warning-close"));

    expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId(`v3-device-${DeviceModelId.stax}`)).toBeVisible();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should go straight to the sync onboarding when the touchscreen flag is off", async () => {
    const { user } = renderSelectDevice({
      lwdOnboardingCounterfeitWarningTouchscreens: { enabled: false },
      lwdOnboardingCounterfeitWarning: { enabled: true },
    });

    await user.click(screen.getByTestId(`v3-device-${DeviceModelId.stax}`));

    expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith(`/onboarding/sync/${DeviceModelId.stax}`);
  });

  it.each([DeviceModelId.nanoS, DeviceModelId.nanoSP, DeviceModelId.nanoX])(
    "should not gate %s on device selection",
    async deviceModelId => {
      const { user, setDeviceModelId } = renderSelectDevice({
        ...TOUCHSCREEN_WARNING_ON,
        lwdOnboardingCounterfeitWarning: { enabled: true },
      });

      await user.click(screen.getByTestId(`v3-device-${deviceModelId}`));

      expect(screen.queryByTestId("counterfeit-warning-dialog")).not.toBeInTheDocument();
      expect(setDeviceModelId).toHaveBeenCalledWith(deviceModelId);
      expect(mockNavigate).toHaveBeenCalledWith("/onboarding/select-use-case");
    },
  );
});
