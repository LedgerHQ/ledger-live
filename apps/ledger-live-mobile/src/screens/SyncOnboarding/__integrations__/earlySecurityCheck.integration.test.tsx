import React from "react";
import { Pressable, Text } from "react-native";
import { render, screen, fireEvent } from "@tests/test-renderer";
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

jest.mock("../LanguagePrompt", () => ({ LanguagePrompt: () => null }));

const device: Device = {
  deviceId: "stax-id",
  deviceName: "Stax",
  modelId: DeviceModelId.stax,
  wired: false,
};

const renderCheck = (isDeviceOnboarded?: boolean) => {
  const navigation = { push: jest.fn() };
  render(
    <EarlySecurityCheck
      navigation={navigation as never}
      route={{ key: "companion", name: ScreenName.SyncOnboardingCompanion, params: {} } as never}
      device={device}
      isAlreadyGenuine
      isDeviceOnboarded={isDeviceOnboarded}
      notifyOnboardingEarlyCheckEnded={jest.fn()}
      notifyEarlySecurityCheckShouldReset={jest.fn()}
      onCancelOnboarding={jest.fn()}
    />,
  );
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

describe("EarlySecurityCheck firmware update", () => {
  it("keeps the app backup for a device that already holds a seed", () => {
    const params = firmwareUpdateParams(renderCheck(true));

    expect(params).toMatchObject({ isBeforeOnboarding: true, isDeviceOnboarded: true });
  });

  it("skips the app backup for a fresh device", () => {
    const params = firmwareUpdateParams(renderCheck());

    expect(params).toMatchObject({ isBeforeOnboarding: true, isDeviceOnboarded: false });
  });
});
