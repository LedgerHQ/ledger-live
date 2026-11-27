import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen, fireEvent, withFlagOverrides } from "@tests/test-renderer";
import type { OsUpdate } from "@domain/entity-device-os-update";
import type { State } from "~/reducers/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { EarlySecurityCheck } from "../EarlySecurityCheck";
import { NavigatorName, ScreenName } from "~/const";

jest.mock("@ledgerhq/live-common/hw/hooks/useGenuineCheck", () => ({
  useGenuineCheck: () => ({
    genuineState: "genuine",
    devicePermissionState: "unrequested",
    error: null,
    resetGenuineCheckState: jest.fn(),
  }),
}));

jest.mock("@ledgerhq/live-common/deviceSDK/hooks/useGetLatestAvailableFirmware", () => ({
  useGetLatestAvailableFirmware: () => ({
    state: {
      firmwareUpdateContext: { final: { name: "2.4.0", version: "2.4.0" } },
      deviceInfo: { version: "2.3.0" },
      error: null,
      status: "available-firmware",
      lockedDevice: false,
    },
  }),
}));

jest.mock("LLM/components/FirmwareUpdateAvailableDrawer", () => ({
  __esModule: true,
  default: ({ isOpen, onUpdate }: { isOpen: boolean; onUpdate: () => void }) =>
    isOpen ? (
      <Pressable onPress={onUpdate}>
        <Text>update-firmware</Text>
      </Pressable>
    ) : null,
}));

const mockIsResolvingOsUpdates = jest.fn(() => false);
jest.mock("LLM/features/OsUpdate/hooks/useResolveOsUpdates", () => ({
  useResolveOsUpdates: () => mockIsResolvingOsUpdates(),
}));

jest.mock("../LanguagePrompt", () => ({ LanguagePrompt: () => null }));

const device: Device = {
  deviceId: "stax-id",
  deviceName: "Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const renderEarlySecurityCheck = ({
  isDeviceOnboarded,
  isPreviousUpdateCancelled,
  overrideInitialState,
}: {
  isDeviceOnboarded?: boolean;
  isPreviousUpdateCancelled?: boolean;
  overrideInitialState?: (state: State) => State;
} = {}) => {
  const navigation = { push: jest.fn() };
  render(
    <EarlySecurityCheck
      navigation={navigation as never}
      route={{ key: "companion", name: ScreenName.SyncOnboardingCompanion, params: {} } as never}
      device={device}
      isAlreadyGenuine
      isDeviceOnboarded={isDeviceOnboarded}
      isPreviousUpdateCancelled={isPreviousUpdateCancelled}
      notifyOnboardingEarlyCheckEnded={jest.fn()}
      notifyEarlySecurityCheckShouldReset={jest.fn()}
      onCancelOnboarding={jest.fn()}
    />,
    { overrideInitialState },
  );
  return navigation;
};

const renderCheck = (
  isDeviceOnboarded?: boolean,
  overrideInitialState?: (state: State) => State,
) => {
  const navigation = renderEarlySecurityCheck({ isDeviceOnboarded, overrideInitialState });
  fireEvent.press(screen.getByText("update-firmware"));
  return navigation;
};

const firmwareUpdateParams = (navigation: { push: jest.Mock }) => {
  expect(navigation.push).toHaveBeenCalledWith(NavigatorName.BaseOnboarding, {
    screen: NavigatorName.SyncOnboarding,
    params: expect.objectContaining({ screen: ScreenName.FirmwareUpdate }),
  });
  return navigation.push.mock.calls[0][1].params.params;
};

const osUpdatesFlow = (osUpdates: OsUpdate[]) => (state: State) => ({
  ...withFlagOverrides({ ldmkOsUpdates: { enabled: true } })(state),
  deviceOsUpdate: { osUpdates, hasBackup: false },
});

describe("EarlySecurityCheck firmware update", () => {
  beforeEach(() => {
    mockIsResolvingOsUpdates.mockReturnValue(false);
  });

  it("keeps the app backup for a device that already holds a seed", () => {
    const params = firmwareUpdateParams(renderCheck(true));

    expect(params).toMatchObject({ isBeforeOnboarding: true, isDeviceOnboarded: true });
  });

  it("skips the app backup for a fresh device", () => {
    const params = firmwareUpdateParams(renderCheck());

    expect(params).toMatchObject({ isBeforeOnboarding: true, isDeviceOnboarded: false });
  });

  describe("with the OS updates flow enabled", () => {
    it("opens the OS updates flow when a path is resolved", () => {
      const navigation = renderCheck(false, osUpdatesFlow([{} as OsUpdate]));

      expect(navigation.push).toHaveBeenCalledWith(NavigatorName.BaseOnboarding, {
        screen: NavigatorName.SyncOnboarding,
        params: expect.objectContaining({ screen: ScreenName.SyncOnboardingOsUpdate }),
      });
    });

    it("falls back to the legacy update when no path is resolved", () => {
      const navigation = renderCheck(false, osUpdatesFlow([]));

      expect(firmwareUpdateParams(navigation)).toMatchObject({ isBeforeOnboarding: true });
    });
  });

  describe("after a cancelled update", () => {
    const updateCta = /Update Ledger Stax/;

    it("waits for the OS updates resolution before offering the update", () => {
      mockIsResolvingOsUpdates.mockReturnValue(true);

      renderEarlySecurityCheck({ isPreviousUpdateCancelled: true });

      expect(screen.queryByText(updateCta)).toBeNull();
    });

    it("offers the update once the OS updates are resolved", () => {
      renderEarlySecurityCheck({ isPreviousUpdateCancelled: true });

      expect(screen.getByText(updateCta)).toBeTruthy();
    });
  });
});
