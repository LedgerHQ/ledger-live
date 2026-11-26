import { track } from "@shared/analytics";
import React from "react";
import { Text } from "react-native";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { useAddMember } from "../hooks/useAddMember";
import { SceneKind } from "../hooks/useFollowInstructionDrawer";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { AnalyticsEvents } from "../Analytics/enums";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { keyRingTreeUpdateFixture } from "@features/platform-key-ring/testing";
import { mockKeyRingTreeRecord } from "@domain/entity-key-ring/schema.mock";
import { ScreenName } from "~/const";

function deferredReject<T = never>() {
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((_, rej) => {
    reject = rej;
  });
  return { promise, reject };
}

const mockActivate = jest.fn();
jest.mock("../hooks/useKeyRingClient", () => {
  const client = jest
    .requireActual("@features/platform-key-ring/testing")
    .fakeKeyRingClient({ activate: (...args: unknown[]) => mockActivate(...args) });
  return { useKeyRingClient: () => client };
});

const createdTrustchain = mockKeyRingTreeRecord({
  rootId: "rootId",
  applicationPath: "applicationPath",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
});
const createdTree = keyRingTreeUpdateFixture(createdTrustchain);

// The v1 SDK errors reach the app unchanged: only their name identifies them.
function keyRingSdkError(name: string): Error {
  const error = new Error();
  error.name = name;
  return error;
}

jest.mock("../hooks/useDestroyTrustchain", () => ({
  useDestroyTrustchain: () => ({
    deleteMutation: {
      isPending: false,
      error: null,
      mutateAsync: jest.fn(),
    },
  }),
}));

const navigationMocks = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  params: undefined as { seededOffer?: boolean } | undefined,
};

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: navigationMocks.navigate,
    getParent: () => ({ goBack: navigationMocks.goBack }),
  }),
  useRoute: () => ({ params: navigationMocks.params }),
}));

const INITIAL_STATE = withFlagOverrides(
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
      hasCompletedOnboarding: true,
    },
    trustchain: {
      ...state.trustchain,
      memberCredentials: {
        privatekey: "mock-private-key",
        pubkey: "mock-public-key",
      },
    },
  }),
);

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
    navigationMocks.params = undefined;
  });

  it("should set GenericError scene when UserRefusedOnDevice is thrown", async () => {
    const { promise, reject } = deferredReject();
    mockActivate.mockReturnValue(promise);

    render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(0);
    reject(new UserRefusedOnDevice());
    await jest.advanceTimersByTimeAsync(0);

    expect(screen.getByTestId("scene-kind").props.children).toBe("GenericError");
  });

  it("should track LedgerSyncRejectedOnDevice with BLE connection type", async () => {
    mockActivate.mockRejectedValue(new UserRefusedOnDevice());

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
    mockActivate.mockRejectedValue(new UserRefusedOnDevice());

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
    const { promise, reject } = deferredReject();
    mockActivate.mockReturnValue(promise);

    render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(0);
    reject(keyRingSdkError("TrustchainNotAllowed"));
    await jest.advanceTimersByTimeAsync(0);

    expect(screen.getByTestId("scene-kind").props.children).toBe("KeyError");
    expect(track).not.toHaveBeenCalled();
  });

  it("should open the loading screen when the trustchain is written", async () => {
    mockActivate.mockResolvedValue({ outcome: "created", tree: createdTree });

    render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(0);

    expect(navigationMocks.navigate).toHaveBeenCalledWith(ScreenName.WalletSyncLoading, {
      created: true,
    });
    expect(navigationMocks.goBack).not.toHaveBeenCalled();
  });

  it("should pop Wallet Sync when the seeded offer trustchain is written", async () => {
    navigationMocks.params = { seededOffer: true };
    mockActivate.mockResolvedValue({ outcome: "created", tree: createdTree });

    const { store } = render(<TestHarness device={MOCK_BLE_DEVICE} />, {
      overrideInitialState: INITIAL_STATE,
    });

    await jest.advanceTimersByTimeAsync(0);

    expect(store.getState().trustchain.trustchain).toMatchObject(createdTrustchain);
    expect(navigationMocks.goBack).toHaveBeenCalledTimes(1);
    expect(navigationMocks.navigate).not.toHaveBeenCalled();
  });
});
