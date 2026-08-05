import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import StepConfirmation from "./03-step-confirmation";
import type { StepProps } from "../types";

jest.mock("~/renderer/analytics/TrackPage", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("~/renderer/analytics/Track", () => ({
  __esModule: true,
  default: () => null,
}));

// Render i18n keys verbatim so assertions check the chosen key, not translated copy.
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

type StepConfirmationComponent = React.FunctionComponent<StepProps> & {
  Footer: React.FunctionComponent<StepProps>;
};

const StepConfirmationWithFooter = StepConfirmation as StepConfirmationComponent;

const deviceInfo = { version: "1.0.0" } as DeviceInfo;

function buildProps(overrides: Partial<StepProps> = {}): StepProps {
  return {
    firmware: {
      osu: {},
      final: { name: "2.0.0" },
      shouldFlashMCU: false,
    } as FirmwareUpdateContext,
    appsToBeReinstalled: false,
    onDrawerClose: jest.fn(),
    setError: jest.fn(),
    deviceModelId: DeviceModelId.nanoX,
    deviceInfo,
    setUpdatedDeviceInfo: jest.fn(),
    transitionTo: jest.fn(),
    onRetry: jest.fn(),
    setCLSBackup: jest.fn(),
    completedRestoreSteps: [],
    setCompletedRestoreSteps: jest.fn(),
    currentRestoreStep: "",
    setCurrentRestoreStep: jest.fn(),
    isLanguagePromptOpen: false,
    setIsLanguagePromptOpen: jest.fn(),
    confirmedPrompt: false,
    setConfirmedPrompt: jest.fn(),
    nonce: 0,
    setNonce: jest.fn(),
    setFirmwareUpdateCompleted: jest.fn(),
    ...overrides,
  } as StepProps;
}

describe("UpdateFirmwareModal StepConfirmation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mark the firmware update as completed on mount", () => {
    const setFirmwareUpdateCompleted = jest.fn();

    render(
      <StepConfirmationWithFooter
        {...buildProps({ appsToBeReinstalled: false, setFirmwareUpdateCompleted })}
      />,
    );

    expect(setFirmwareUpdateCompleted).toHaveBeenCalledWith(true);
    expect(screen.getByTestId("firmware-update-done")).toBeVisible();
  });

  it("should show the apps reinstall subtitle when apps will be restored", () => {
    render(<StepConfirmationWithFooter {...buildProps({ appsToBeReinstalled: true })} />);

    expect(screen.getByText("manager.modal.successSubtitleApps")).toBeVisible();
  });

  it("should show the default success title when apps will not be restored", () => {
    render(<StepConfirmationWithFooter {...buildProps({ appsToBeReinstalled: false })} />);

    expect(screen.getByText("manager.modal.successTitle")).toBeVisible();
  });
});

describe("UpdateFirmwareModal StepConfirmation.Footer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call onDrawerClose when Finish is pressed", async () => {
    const onDrawerClose = jest.fn();
    const { user } = render(
      <StepConfirmationWithFooter.Footer
        {...buildProps({ appsToBeReinstalled: false, onDrawerClose })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "manager.modal.SuccessCTANoApps" }));
    expect(onDrawerClose).toHaveBeenCalledWith(false);
  });

  it("should call a custom success handler when provided", async () => {
    const onDrawerClose = jest.fn();
    const finalStepSuccessButtonOnClick = jest.fn();
    const { user } = render(
      <StepConfirmationWithFooter.Footer
        {...buildProps({
          appsToBeReinstalled: true,
          onDrawerClose,
          finalStepSuccessButtonOnClick,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "manager.modal.sucessCTAApps" }));
    expect(finalStepSuccessButtonOnClick).toHaveBeenCalledTimes(1);
    expect(onDrawerClose).not.toHaveBeenCalled();
  });

  it("should call onDrawerClose with reinstall when restore apps is pressed", async () => {
    const onDrawerClose = jest.fn();
    const { user } = render(
      <StepConfirmationWithFooter.Footer
        {...buildProps({ appsToBeReinstalled: true, onDrawerClose })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "manager.modal.sucessCTAApps" }));
    expect(onDrawerClose).toHaveBeenCalledWith(true);
  });

  it("should render a custom success button label when provided", async () => {
    const onDrawerClose = jest.fn();
    const { user } = render(
      <StepConfirmationWithFooter.Footer
        {...buildProps({
          finalStepSuccessButtonLabel: "Continue setup",
          onDrawerClose,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continue setup" }));
    expect(onDrawerClose).toHaveBeenCalledWith(false);
  });
});
