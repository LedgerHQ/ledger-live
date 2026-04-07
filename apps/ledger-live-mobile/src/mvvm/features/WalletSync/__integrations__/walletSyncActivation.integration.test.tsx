import React from "react";
import { screen } from "@testing-library/react-native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { render, withFlagOverrides } from "@tests/test-renderer";
import { INITIAL_TEST, WalletSyncSharedNavigator } from "./shared";
import { setEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/types-devices";

const mockSelectedDevice: Device = {
  deviceId: "1",
  deviceName: "STAX A",
  modelId: DeviceModelId.stax,
  wired: false,
};

const mockDiscoveredDevice = {
  id: "mock-discovered-device",
} as DiscoveredDevice;

jest.mock("~/components/SelectDevice2", () => {
  const React = jest.requireActual("react");
  const { TouchableOpacity, Text } = jest.requireActual("react-native");

  return {
    __esModule: true,
    default: ({
      onSelect,
    }: {
      onSelect: (device: Device, discoveredDevice: DiscoveredDevice) => void;
    }) => (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={mockSelectedDevice.deviceName}
        onPress={() => onSelect(mockSelectedDevice, mockDiscoveredDevice)}
      >
        <Text>{mockSelectedDevice.deviceName}</Text>
      </TouchableOpacity>
    ),
  };
});

describe("WalletSyncActivation", () => {
  afterEach(() => {
    setEnv("MOCK", "");
  });

  it("Should open WalletSyncActivation Flow and go through device selection", async () => {
    setEnv("MOCK", "1");

    const { user } = render(<WalletSyncSharedNavigator />, {
      overrideInitialState: withFlagOverrides(
        {
          llmWalletSync: {
            enabled: true,
            params: {
              environment: "STAGING",
              watchConfig: {},
            },
          },
        },
        state => ({
          ...state,
          settings: {
            ...state.settings,
            readOnlyModeEnabled: false,
          },
        }),
      ),
    });

    // Check if the activation screen is visible
    expect(await screen.findByText(/Turn on Ledger Sync for this phone?/i)).toBeVisible();

    // On Press Sync Accounts
    await user.press(
      await screen.findByRole("button", {
        name: "Turn on Ledger Sync",
      }),
    );

    expect(await screen.findByText(/Choose a Ledger device/i)).toBeVisible();

    await user.press(
      await screen.findByRole("button", {
        name: "STAX A",
      }),
    );

    expect(await screen.findByTestId("device-action-loading")).toBeVisible();

    // await waitFor(async () => {
    //   expect(await screen.findByText(`Continue on your Ledger Stax`)).toBeVisible();
    // });
  });

  it("Should open WalletSyncActivation Flow with learn More link", async () => {
    render(<WalletSyncSharedNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });

    expect(await screen.findByText(/Turn on Ledger Sync for this phone/i)).toBeVisible();
    expect(await screen.findByText(/How does Ledger Sync work?/i)).toBeVisible();
  });

  it("Should open WalletSyncActivation Flow without learn More link", async () => {
    render(<WalletSyncSharedNavigator />, {
      overrideInitialState: withFlagOverrides(
        {
          llmWalletSync: {
            enabled: true,
            params: {
              environment: "STAGING",
              watchConfig: {},
            },
          },
        },
        state => ({
          ...state,
          settings: {
            ...state.settings,
            readOnlyModeEnabled: false,
          },
        }),
      ),
    });

    expect(await screen.findByText(/Turn on Ledger Sync for this phone/i)).toBeVisible();
    expect(screen.queryByText(/How does Ledger Sync work?/i)).toBeNull();
  });
});
