/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DeviceModelId } from "@ledgerhq/types-devices";
import React from "react";
import { screen, render, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import PendingTransferProposals from "../index";
import { ACCOUNT_XPUB, createCantonAccount, createRawProposal } from "../__tests__/test-utils";

const mockPerformTransferInstruction = jest.fn().mockResolvedValue(undefined);
const mockSync = jest.fn();

jest.mock("@ledgerhq/live-common/families/canton/react", () => ({
  ...jest.requireActual<typeof import("@ledgerhq/live-common/families/canton/react")>(
    "@ledgerhq/live-common/families/canton/react",
  ),
  useCantonAcceptOrRejectOffer: () => mockPerformTransferInstruction,
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockSync,
}));

jest.mock("~/components/DeviceActionModal", () => {
  const MockReact = jest.requireActual<typeof React>("react");
  const { View: RNView, Pressable: RNPressable } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: (props: {
      onResult?: (payload: { device: { deviceId: string; wired: boolean } }) => void;
    }) =>
      MockReact.createElement(
        RNView,
        { testID: "device-action-modal" },
        MockReact.createElement(RNPressable, {
          testID: "canton-offers-mock-device-confirm",
          onPress: () =>
            props.onResult?.({ device: { deviceId: "ledger-test-device", wired: false } }),
        }),
      ),
  };
});

type StackParamList = { Account: undefined };
const Stack = createNativeStackNavigator<StackParamList>();

function OffersTestStack({
  account,
  parentAccount,
}: {
  account: ReturnType<typeof createCantonAccount>;
  parentAccount: ReturnType<typeof createCantonAccount>;
}) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Account">
        {() => <PendingTransferProposals account={account} parentAccount={parentAccount} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const withLastConnectedDevice = (state: State): State => ({
  ...state,
  settings: {
    ...state.settings,
    lastConnectedDevice: {
      deviceId: "last-connected-id",
      modelId: DeviceModelId.nanoX,
      wired: false,
    },
  },
});

describe("Canton pending offers integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformTransferInstruction.mockResolvedValue(undefined);
  });

  it("accepts an incoming offer as recipient (Review → Accept → device)", async () => {
    const parentAccount = createCantonAccount();
    const account = createCantonAccount({
      cantonResources: {
        isOnboarded: true,
        instrumentUtxoCounts: {},
        xpub: ACCOUNT_XPUB,
        pendingTransferProposals: [
          createRawProposal("contract-accept-1", "other-party-xpub", ACCOUNT_XPUB),
        ],
      } as any,
    });

    const { user } = render(<OffersTestStack account={account} parentAccount={parentAccount} />, {
      overrideInitialState: withLastConnectedDevice,
    });

    await user.press(await screen.findByText("Review"));
    expect(await screen.findByText("Incoming transfer details")).toBeOnTheScreen();

    await user.press(screen.getByText("Accept"));
    expect(await screen.findByTestId("device-action-modal")).toBeOnTheScreen();

    await user.press(screen.getByTestId("canton-offers-mock-device-confirm"));

    // Assert perform + sync in one waitFor: sync runs only after perform's promise resolves.
    await waitFor(() => {
      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-accept-1", deviceId: "ledger-test-device", reason: "" },
        "accept-transfer-instruction",
      );
      expect(mockSync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          reason: "canton-pending-transaction-action",
        }),
      );
    });
    expect(await screen.findByText("Transfer accepted")).toBeOnTheScreen();
  });

  it("rejects an incoming offer as recipient (Review → Reject → device)", async () => {
    const parentAccount = createCantonAccount();
    const account = createCantonAccount({
      cantonResources: {
        isOnboarded: true,
        instrumentUtxoCounts: {},
        xpub: ACCOUNT_XPUB,
        pendingTransferProposals: [
          createRawProposal("contract-reject-1", "other-party-xpub", ACCOUNT_XPUB),
        ],
      } as any,
    });

    const { user } = render(<OffersTestStack account={account} parentAccount={parentAccount} />, {
      overrideInitialState: withLastConnectedDevice,
    });

    await user.press(await screen.findByText("Review"));
    await user.press(screen.getByText("Reject"));
    expect(await screen.findByTestId("device-action-modal")).toBeOnTheScreen();

    await user.press(screen.getByTestId("canton-offers-mock-device-confirm"));

    await waitFor(() => {
      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-reject-1", deviceId: "ledger-test-device", reason: "" },
        "reject-transfer-instruction",
      );
      expect(mockSync).toHaveBeenCalled();
    });
    expect(
      await screen.findByText("The incoming transfer has been successfully rejected."),
    ).toBeOnTheScreen();
  });

  it("cancels an outgoing offer as sender (withdraw on row → device)", async () => {
    const parentAccount = createCantonAccount();
    const account = createCantonAccount({
      cantonResources: {
        isOnboarded: true,
        instrumentUtxoCounts: {},
        xpub: ACCOUNT_XPUB,
        pendingTransferProposals: [
          createRawProposal("contract-withdraw-1", ACCOUNT_XPUB, "receiver-party-xpub"),
        ],
      } as any,
    });

    const { user } = render(<OffersTestStack account={account} parentAccount={parentAccount} />, {
      overrideInitialState: withLastConnectedDevice,
    });

    await user.press(screen.getByTestId("withdraw-button-contract-withdraw-1"));
    expect(await screen.findByTestId("device-action-modal")).toBeOnTheScreen();

    await user.press(screen.getByTestId("canton-offers-mock-device-confirm"));

    await waitFor(() => {
      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-withdraw-1", deviceId: "ledger-test-device", reason: "" },
        "withdraw-transfer-instruction",
      );
      expect(mockSync).toHaveBeenCalled();
    });
    expect(
      await screen.findByText("The outgoing transfer has been successfully rejected."),
    ).toBeOnTheScreen();
  });
});
