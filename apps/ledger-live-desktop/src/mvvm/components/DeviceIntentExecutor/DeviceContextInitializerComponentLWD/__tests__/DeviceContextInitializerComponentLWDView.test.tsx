import React from "react";
import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
  DeviceIntentTrackingProvider,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
import { DeviceContextInitializerComponentLWDView } from "../DeviceContextInitializerComponentLWDView";
import { initializerDevice } from "../testUtils";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";

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

jest.mock("../../components/TrackDIEScreen", () => ({
  TrackDIEScreen: jest.fn(() => null),
}));

jest.mock("~/renderer/components/DeviceAction/DeviceBlocker", () => ({
  DeviceBlocker: jest.fn(() => null),
}));

const mockedTrackDIEScreen = jest.mocked(TrackDIEScreen);
const mockedDeviceBlocker = jest.mocked(DeviceBlocker);

const pageByStateType: Record<EnsureAppReadyState["type"], string | undefined> = {
  [LoadingStateType.Loading]: PAGE_CONNECT_APP.Loading,
  [LoadingStateType.InstallingApp]: PAGE_CONNECT_APP.InstallingApp,
  [DeviceInteractionRequiredType.UnlockDevice]: PAGE_CONNECT_APP.UnlockDevice,
  [DeviceInteractionRequiredType.AllowSecureConnection]: PAGE_CONNECT_APP.AllowSecureConnection,
  [DeviceInteractionRequiredType.ConfirmOpenApp]: PAGE_CONNECT_APP.ConfirmOpenApp,
  [AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking]:
    PAGE_CONNECT_APP.DeviceDeprecatedWarning,
  [AppInteractionRequiredStateType.OutdatedAppWarning]: PAGE_CONNECT_APP.OutdatedAppWarning,
  [RetryableStateType.UserRefusedOnDevice]: PAGE_CONNECT_APP.UserRefused,
  [RetryableStateType.DeviceLocked]: PAGE_CONNECT_APP.DeviceLocked,
  [RetryableStateType.DeviceBusy]: PAGE_CONNECT_APP.DeviceBusy,
  [BlockingStateType.UnsupportedFirmwareVersion]: PAGE_CONNECT_APP.UnsupportedFirmware,
  [BlockingStateType.UnsupportedApplication]: PAGE_CONNECT_APP.UnsupportedApplication,
  [BlockingStateType.UnsupportedFeature]: PAGE_CONNECT_APP.UnsupportedFeature,
  [BlockingStateType.DeviceDeprecatedBlocking]: PAGE_CONNECT_APP.DeviceDeprecatedBlocking,
  [BlockingStateType.WrongDeviceForAccount]: PAGE_CONNECT_APP.WrongDeviceForAccount,
  [BlockingStateType.DeviceOutOfStorageSpace]: PAGE_CONNECT_APP.OutOfStorage,
  [BlockingStateType.DeviceNotOnboarded]: PAGE_CONNECT_APP.DeviceNotOnboarded,
  [BlockingStateType.InvalidProvider]: PAGE_CONNECT_APP.InvalidProvider,
  [FinalStateType.Error]: PAGE_CONNECT_APP.Error,
  [FinalStateType.Success]: undefined,
};

function renderView(state: EnsureAppReadyState) {
  return render(
    <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
      <DeviceContextInitializerComponentLWDView
        state={state}
        device={initializerDevice}
        onCancel={jest.fn()}
      />
    </DeviceIntentTrackingProvider>,
  );
}

describe("DeviceContextInitializerComponentLWDView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN the loading state WHEN rendering THEN it renders the loading content", () => {
    // WHEN
    renderView({ type: LoadingStateType.Loading });

    // THEN
    expect(screen.getByText("Loading")).toBeVisible();
  });

  it.each([
    LoadingStateType.Loading,
    LoadingStateType.InstallingApp,
    DeviceInteractionRequiredType.UnlockDevice,
    DeviceInteractionRequiredType.AllowSecureConnection,
    DeviceInteractionRequiredType.ConfirmOpenApp,
  ])("GIVEN the %s state WHEN rendering THEN it blocks dialog dismissal", type => {
    renderView({ type } as EnsureAppReadyState);

    expect(mockedDeviceBlocker).toHaveBeenCalledTimes(1);
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
      getElement: () => screen.getByText("Action needed on your Ledger device"),
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
      getElement: () =>
        screen.getByText("Use the Ledger device you originally set up this account with"),
    },
    {
      label: "device not onboarded",
      state: { type: BlockingStateType.DeviceNotOnboarded },
      getElement: () => screen.getByText("Your Ledger device needs to be set up"),
    },
    {
      label: "invalid provider",
      state: { type: BlockingStateType.InvalidProvider },
      getElement: () => screen.getByText("Invalid Provider"),
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
      expect(mockedTrackDIEScreen).toHaveBeenCalledWith(
        expect.objectContaining({
          category: pageByStateType[state.type],
          modelId: initializerDevice.modelId,
          refreshSource: true,
        }),
        undefined,
      );
    },
  );

  it("GIVEN the device storage blocking state WHEN rendering THEN it renders the storage content", () => {
    // WHEN
    renderView({
      type: BlockingStateType.DeviceOutOfStorageSpace,
      appNames: ["Ethereum", "Bitcoin"],
    });

    // THEN
    expect(screen.getByText("Uninstall some apps to free up Ledger device memory")).toBeVisible();
    expect(screen.getByText("Apps to manage: Ethereum, Bitcoin")).toBeVisible();
    expect(screen.getByRole("button", { name: "Go to My Ledger" })).toBeVisible();
    expect(mockedTrackDIEScreen).toHaveBeenCalledWith(
      expect.objectContaining({ category: PAGE_CONNECT_APP.OutOfStorage }),
      undefined,
    );
  });

  const renderUserRefusalState = () => {
    const retry = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <DeviceIntentTrackingProvider value={{ sourceFlow: "my_ledger" }}>
        <DeviceContextInitializerComponentLWDView
          state={{ type: RetryableStateType.UserRefusedOnDevice, retry }}
          device={initializerDevice}
          onCancel={onCancel}
        />
      </DeviceIntentTrackingProvider>,
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
    expect(mockedTrackDIEScreen).toHaveBeenCalledWith(
      expect.objectContaining({ category: PAGE_CONNECT_APP.UserRefused }),
      undefined,
    );
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
