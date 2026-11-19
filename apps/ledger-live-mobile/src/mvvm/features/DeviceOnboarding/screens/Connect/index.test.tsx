import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen } from "@tests/test-renderer";
import { funnelTestIds } from "LLM/features/DeviceOnboarding/testIds";
import { DeviceOnboardingConnect } from "./index";
import {
  useDeviceOnboardingConnectViewModel,
  type DeviceOnboardingConnectModel,
} from "./useDeviceOnboardingConnectViewModel";

jest.mock("./useDeviceOnboardingConnectViewModel", () => ({
  useDeviceOnboardingConnectViewModel: jest.fn(),
}));

jest.mock("LLM/components/ConnectNewDevice", () => ({
  ConnectNewDevice: () => null,
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const RN = jest.requireActual("react-native");

  return {
    ...actual,
    BottomSheetHeader: () => null,
    BottomSheetView: ({ children }: { children?: React.ReactNode }) => (
      <RN.View>{children}</RN.View>
    ),
  };
});

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  ...jest.requireActual("@shared/ui-queued-bottom-sheet"),
  QueuedBottomSheet: jest.requireActual("@shared/ui-queued-bottom-sheet/testing/module-mock")
    .QueuedBottomSheet,
}));

const useViewModel = jest.mocked(useDeviceOnboardingConnectViewModel);

function model(
  overrides: Partial<DeviceOnboardingConnectModel> = {},
): DeviceOnboardingConnectModel {
  return {
    closeLabel: "Close",
    showDeviceList: true,
    unlockSheet: null,
    onConnected: jest.fn(),
    onClose: jest.fn(),
    onDeviceNotFound: jest.fn(),
    ...overrides,
  };
}

describe("DeviceOnboardingConnect", () => {
  it("should not show the unlock sheet while the device is not locked", () => {
    useViewModel.mockReturnValue(model());

    render(<DeviceOnboardingConnect />);

    expect(screen.queryByTestId(funnelTestIds.unlockSheet)).toBeNull();
  });

  it("should open the unlock sheet without a close action when the device is locked", () => {
    useViewModel.mockReturnValue(
      model({ unlockSheet: { deviceModelId: DeviceModelId.stax, deviceName: "Ledger Stax" } }),
    );

    render(<DeviceOnboardingConnect />);

    expect(screen.getByText("Unlock your Ledger Stax")).toBeVisible();
    expect(screen.getByTestId(funnelTestIds.unlockSheet)).toBeVisible();
    expect(screen.queryByTestId(`${funnelTestIds.unlockSheet}-header-close`)).toBeNull();
    expect(screen.queryByTestId(`${funnelTestIds.unlockSheet}-dismiss`)).toBeNull();
    expect(screen.queryByTestId(`${funnelTestIds.unlockSheet}-backdrop`)).toBeNull();
  });
});
