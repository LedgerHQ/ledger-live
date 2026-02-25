import React from "react";
import { Text } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { useAddMember } from "../hooks/useAddMember";
import { SceneKind } from "../hooks/useFollowInstructionDrawer";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { TrustchainNotAllowed } from "@ledgerhq/ledger-key-ring-protocol/errors";
import { track } from "~/analytics";
import { AnalyticsEvents } from "../Analytics/enums";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { State } from "~/reducers/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const mockGetOrCreateTrustchain = jest.fn();
jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    getOrCreateTrustchain: mockGetOrCreateTrustchain,
  }),
}));

jest.mock("../hooks/useDestroyTrustchain", () => ({
  useDestroyTrustchain: () => ({
    deleteMutation: {
      isPending: false,
      error: null,
      mutateAsync: jest.fn(),
    },
  }),
}));

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const INITIAL_STATE = (state: State) => ({
  ...state,
  settings: {
    ...state.settings,
    readOnlyModeEnabled: false,
    hasCompletedOnboarding: true,
    overriddenFeatureFlags: {
      llmWalletSync: {
        enabled: true,
        params: {
          environment: "STAGING",
          watchConfig: {},
        },
      },
    },
  },
  trustchain: {
    ...state.trustchain,
    memberCredentials: {
      privatekey: "mock-private-key",
      pubkey: "mock-public-key",
    },
  },
});

const MOCK_BLE_DEVICE = {
  deviceId: "test-device-id",
  deviceName: "Test Device",
  modelId: DeviceModelId.stax,
  wired: false,
} as Device;

const MOCK_USB_DEVICE = {
  deviceId: "test-device-id",
  deviceName: "Test Device",
  modelId: DeviceModelId.stax,
  wired: true,
} as Device;

function TestHarness({ device }: { device: Device }) {
  const { scene } = useAddMember({ device });
  return <Text testID="scene-kind">{SceneKind[scene.kind]}</Text>;
}

describe("useAddMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set GenericError scene when UserRefusedOnDevice is thrown", async () => {
    mockGetOrCreateTrustchain.mockRejectedValue(new UserRefusedOnDevice());

    render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(100);
    jest.runAllTimers();
    await jest.advanceTimersByTimeAsync(0);

    expect(screen.getByTestId("scene-kind").props.children).toBe("GenericError");
  });

  it("should track LedgerSyncRejectedOnDevice with BLE connection type", async () => {
    mockGetOrCreateTrustchain.mockRejectedValue(new UserRefusedOnDevice());

    render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(100);

    expect(track).toHaveBeenCalledWith(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
      page: "Ledger Sync",
      modelId: DeviceModelId.stax,
      connectionType: CONNECTION_TYPES.BLE,
    });
  });

  it("should track LedgerSyncRejectedOnDevice with USB connection type", async () => {
    mockGetOrCreateTrustchain.mockRejectedValue(new UserRefusedOnDevice());

    render(<TestHarness device={MOCK_USB_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(100);

    expect(track).toHaveBeenCalledWith(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
      page: "Ledger Sync",
      modelId: DeviceModelId.stax,
      connectionType: CONNECTION_TYPES.USB,
    });
  });

  it("should set KeyError scene without tracking on TrustchainNotAllowed", async () => {
    mockGetOrCreateTrustchain.mockRejectedValue(new TrustchainNotAllowed());

    render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(100);
    jest.runAllTimers();
    await jest.advanceTimersByTimeAsync(0);

    expect(screen.getByTestId("scene-kind").props.children).toBe("KeyError");
    expect(track).not.toHaveBeenCalled();
  });
});
