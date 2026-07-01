import React from "react";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { DeviceContextInitializerComponentLWDView } from "../DeviceContextInitializerComponentLWDView";
import { initializerDevice } from "../testUtils";

jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: jest.fn(() => undefined),
}));

jest.mock("~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen", () => ({
  DeviceDeprecationScreens: {
    clearSigningScreen: 0,
    warningScreen: 1,
    errorScreen: 2,
  },
  DeviceDeprecationScreen: ({ screenName }: { screenName: number }) => (
    <div data-testid={`device-deprecation-screen-${screenName}`} />
  ),
}));

jest.mock("~/renderer/components/TranslatedError", () => ({
  __esModule: true,
  default: ({ field }: { field: string }) => <span>{`translated-${field}`}</span>,
}));

function renderView(state: EnsureAppReadyState) {
  return render(
    <DeviceContextInitializerComponentLWDView
      state={state}
      device={initializerDevice}
      onCancel={jest.fn()}
    />,
  );
}

describe("DeviceContextInitializerComponentLWDView", () => {
  it("GIVEN the loading state WHEN rendering THEN it renders the loading content", () => {
    // WHEN
    renderView({ type: LoadingStateType.Loading });

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });

  it.each([
    {
      label: "installing app",
      state: { type: LoadingStateType.InstallingApp },
      getElement: () => screen.getByText("Installing app"),
    },
    {
      label: "unlock device",
      state: { type: DeviceInteractionRequiredType.UnlockDevice },
      getElement: () => screen.getByTestId("device-initializer-unlock-device"),
    },
    {
      label: "allow secure connection",
      state: { type: DeviceInteractionRequiredType.AllowSecureConnection },
      getElement: () => screen.getByTestId("device-initializer-allow-secure-connection"),
    },
    {
      label: "confirm open app",
      state: { type: DeviceInteractionRequiredType.ConfirmOpenApp },
      getElement: () => screen.getByTestId("device-initializer-confirm-open-app"),
    },
    {
      label: "non-blocking device deprecation",
      state: {
        type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking,
        decision: {
          status: "show",
          screenSequence: ["warning"],
          currencyName: "Ethereum",
          deviceModelId: DeviceModelId.nanoX,
          supportEndDate: new Date("2026-01-01"),
        },
        onContinue: jest.fn(),
      },
      getElement: () => screen.getByTestId("device-deprecation-screen-1"),
    },
    {
      label: "outdated app warning",
      state: {
        type: AppInteractionRequiredStateType.OutdatedAppWarning,
        appName: "Ethereum",
        onContinue: jest.fn(),
      },
      getElement: () => screen.getByText("App version outdated"),
    },
    {
      label: "retryable device locked",
      state: { type: RetryableStateType.DeviceLocked, retry: jest.fn() },
      getElement: () => screen.getByTestId("device-initializer-retryable-device-locked"),
    },
    {
      label: "retryable device busy",
      state: { type: RetryableStateType.DeviceBusy, retry: jest.fn() },
      getElement: () => screen.getByText("Action pending on your Ledger device"),
    },
    {
      label: "unsupported firmware version",
      state: { type: BlockingStateType.UnsupportedFirmwareVersion },
      getElement: () => screen.getByText("Ledger OS update required"),
    },
    {
      label: "unsupported application",
      state: {
        type: BlockingStateType.UnsupportedApplication,
        appName: "Ethereum",
        deviceModelId: DeviceModelId.nanoX,
      },
      getElement: () => screen.getByTestId("device-initializer-unsupported-application"),
    },
    {
      label: "unsupported feature",
      state: {
        type: BlockingStateType.UnsupportedFeature,
        deviceModelId: DeviceModelId.nanoX,
      },
      getElement: () => screen.getByTestId("device-initializer-unsupported-feature"),
    },
    {
      label: "blocking device deprecation",
      state: {
        type: BlockingStateType.DeviceDeprecatedBlocking,
        decision: {
          status: "block",
          currencyName: "Ethereum",
          deviceModelId: DeviceModelId.nanoX,
          supportEndDate: new Date("2026-01-01"),
        },
      },
      getElement: () => screen.getByTestId("device-deprecation-screen-2"),
    },
    {
      label: "wrong device for account",
      state: {
        type: BlockingStateType.WrongDeviceForAccount,
        accountName: "Ethereum 1",
      },
      getElement: () => screen.getByText("Wrong Secret Recovery Phrase"),
    },
    {
      label: "device not onboarded",
      state: { type: BlockingStateType.DeviceNotOnboarded },
      getElement: () => screen.getByText("Your Ledger is not ready to use yet"),
    },
    {
      label: "final error",
      state: { type: FinalStateType.Error, error: new Error("unexpected") },
      getElement: () => screen.getByText("translated-title"),
    },
  ] satisfies Array<{
    label: string;
    state: EnsureAppReadyState;
    getElement: () => HTMLElement;
  }>)(
    "GIVEN the $label state WHEN rendering THEN it renders the matching desktop state",
    ({ state, getElement }) => {
      // WHEN
      renderView(state);

      // THEN
      expect(getElement()).toBeVisible();
    },
  );

  it("GIVEN the device storage blocking state WHEN rendering THEN it renders the storage content", () => {
    // WHEN
    renderView({
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Ethereum", "Bitcoin"],
    });

    // THEN
    expect(screen.getByText("Not enough device memory")).toBeVisible();
    expect(screen.getByText("Apps to manage: Ethereum, Bitcoin")).toBeVisible();
    expect(screen.getByRole("button", { name: "Go to My Ledger" })).toBeVisible();
  });

  const renderUserRefusalState = () => {
    const retry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <DeviceContextInitializerComponentLWDView
        state={{ type: RetryableStateType.UserRefusedOnDevice, retry }}
        device={initializerDevice}
        onCancel={onCancel}
      />,
    );
    return { user, retry, onCancel };
  };

  it("GIVEN a retryable user refusal state WHEN clicking Close THEN it forwards the cancel callback", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderUserRefusalState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Close" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
  });

  it("GIVEN a retryable user refusal state WHEN clicking Retry THEN it forwards the retry callback", async () => {
    // GIVEN
    const { user, retry, onCancel } = renderUserRefusalState();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // THEN
    expect(retry).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("GIVEN the success state WHEN rendering THEN it renders no content", () => {
    // WHEN
    const { container } = renderView({
      type: FinalStateType.Success,
      extractedContext: {
        currentOsVersion: "2.2.0",
        osUpdateAvailable: false,
        currentAppName: "Ethereum",
        currentAppVersion: "1.0.0",
        derivedAddress: undefined,
      },
    });

    // THEN
    expect(container).toBeEmptyDOMElement();
  });
});
