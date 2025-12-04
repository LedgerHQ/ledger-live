/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TopologyChangeError } from "@ledgerhq/coin-canton/types/errors";
import type { TransferInstructionType } from "@ledgerhq/live-common/families/canton/react";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  createMockAccount,
  createMockNavigation,
  getMockFormatDate,
  getMockLocale,
  getMockTouchable,
  getMockUseAccountUnit,
} from "../Onboard/steps/__tests__/test-utils";
import PendingTransferProposals from "./index";
import { type TransferProposalAction } from "./types";

const mockPerformTransferInstruction = jest.fn();
const mockSync = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: jest.fn(() => mockSync),
}));

jest.mock("@ledgerhq/live-common/families/canton/react", () => ({
  useTimeRemaining: jest.fn(() => ""),
  useCantonAcceptOrRejectOffer: jest.fn(() => mockPerformTransferInstruction),
}));

jest.mock("@ledgerhq/native-ui", () => {
  const { getMockNativeUI } = jest.requireActual("../Onboard/steps/__tests__/test-utils");
  const mockNativeUI = getMockNativeUI();
  return {
    ...mockNativeUI,
    IconsLegacy: {
      ...mockNativeUI.IconsLegacy,
      CloseMedium: () => <View testID="icon-close-medium" />,
      ArrowBottomMedium: () => <View testID="icon-arrow-bottom-medium" />,
    },
  };
});

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: jest.fn(() => ({ ...createMockNavigation(), navigate: mockNavigate })),
    useRoute: jest.fn(() => ({
      name: "Account" as any,
      params: {},
      key: "test-route-key",
      path: undefined,
    })),
    useFocusEffect: jest.fn(callback => {
      useEffect(() => {
        callback();
      }, [callback]);
    }),
  };
});

jest.mock("react-i18next", () => {
  const { getMockReactI18next } = jest.requireActual("../Onboard/steps/__tests__/test-utils");
  return getMockReactI18next();
});

jest.mock("react-redux", () => {
  const { getMockReactRedux } = jest.requireActual("../Onboard/steps/__tests__/test-utils");
  return getMockReactRedux();
});

jest.mock("~/components/CounterValue", () => ({
  __esModule: true,
  default: () => (
    <View testID="counter-value">
      <Text>$0.00</Text>
    </View>
  ),
}));

jest.mock("~/components/CurrencyUnitValue", () => ({
  __esModule: true,
  default: ({ value, unit }: any) => (
    <View testID="currency-unit-value">
      <Text>
        {value?.toString() || "0"} {unit?.code || ""}
      </Text>
    </View>
  ),
}));

jest.mock("~/components/DateFormat/FormatDate", () => getMockFormatDate());

jest.mock("~/components/DateFormat/FormatDay", () => ({
  __esModule: true,
  default: ({ day }: any) => <Text>{day.toISOString()}</Text>,
}));

jest.mock("~/components/SectionHeader", () => ({
  __esModule: true,
  default: ({ day }: any) => (
    <View testID="section-header">
      <Text>{day.toISOString()}</Text>
    </View>
  ),
}));

jest.mock("~/components/Touchable", () => getMockTouchable());

jest.mock("~/context/Locale", () => getMockLocale());

jest.mock("~/hooks/useAccountUnit", () => getMockUseAccountUnit());

jest.mock("~/icons/ArrowRight", () => ({
  __esModule: true,
  default: () => (
    <View testID="icon-arrow-right">
      <Text>ArrowRight</Text>
    </View>
  ),
}));

jest.mock("~/icons/Close", () => ({
  __esModule: true,
  default: () => (
    <View testID="icon-close">
      <Text>Close</Text>
    </View>
  ),
}));

jest.mock("~/icons/Receive", () => ({
  __esModule: true,
  default: () => (
    <View testID="icon-receive">
      <Text>Receive</Text>
    </View>
  ),
}));

jest.mock("~/screens/WalletCentricSections/SectionContainer", () => ({
  __esModule: true,
  default: ({ children, testID, ...props }: any) => (
    <View testID={testID} {...props}>
      {children}
    </View>
  ),
}));

jest.mock("~/screens/WalletCentricSections/SectionTitle", () => ({
  __esModule: true,
  default: ({ title }: any) => <View>{title}</View>,
}));

jest.mock("./DeviceAppModal", () => {
  const MockDeviceAppModal = ({ isOpen, onConfirm, onClose, action }: any) => {
    const [state, setState] = useState<"pending" | "confirming" | "completed" | "error">("pending");

    useEffect(() => {
      if (isOpen) setState("pending");
    }, [isOpen]);

    const handleConfirm = async () => {
      setState("confirming");
      try {
        await onConfirm("test-device-id");
        setState("completed");
      } catch {
        setState("error");
      }
    };

    if (!isOpen) return null;

    return (
      <View testID="device-app-modal">
        {state === "completed" && (
          <View testID="device-app-modal-success">
            <Text>Success</Text>
            <Pressable testID="modal-close" onPress={onClose}>
              <Text>Close</Text>
            </Pressable>
          </View>
        )}
        {state === "error" && (
          <View testID="device-app-modal-error">
            <Text>Error occurred</Text>
            <Pressable testID="modal-retry" onPress={() => setState("pending")}>
              <Text>Retry</Text>
            </Pressable>
          </View>
        )}
        {state === "confirming" && (
          <View testID="device-app-modal-confirming">
            <Text>Processing...</Text>
          </View>
        )}
        {state === "pending" && (
          <Pressable testID={`modal-confirm-${action}`} onPress={handleConfirm}>
            <Text>Confirm</Text>
          </Pressable>
        )}
      </View>
    );
  };
  return { __esModule: true, default: MockDeviceAppModal };
});

jest.mock("./PendingTransferProposalsDetails", () => ({
  __esModule: true,
  default: ({ onOpenModal, contractId, isOpen }: any) =>
    isOpen ? (
      <View testID="pending-transfer-proposals-details">
        <Pressable
          testID={`details-accept-${contractId}`}
          onPress={() => onOpenModal(contractId, "accept")}
        >
          <Text>Accept</Text>
        </Pressable>
        <Pressable
          testID={`details-reject-${contractId}`}
          onPress={() => onOpenModal(contractId, "reject")}
        >
          <Text>Reject</Text>
        </Pressable>
      </View>
    ) : null,
}));

const createCantonAccount = (
  contractId: string,
  partyId = "test-party-id",
  receiver = partyId,
  isOutgoing = false,
): CantonAccount => {
  const account = createMockAccount({ xpub: partyId }) as CantonAccount;
  const sender = isOutgoing ? partyId : "sender-address";
  account.cantonResources = {
    pendingTransferProposals: [
      {
        contract_id: contractId,
        sender,
        receiver,
        amount: "1000000",
        instrument_id: "instrument-123",
        memo: "",
        expires_at_micros: Date.now() * 1000 + 3600000000,
      },
    ],
    instrumentUtxoCounts: {},
    publicKey: "test-public-key",
  };
  return account;
};

const renderComponent = (account: CantonAccount) =>
  render(<PendingTransferProposals account={account} />);

const waitForElement = (queryByTestId: any, testId: string) =>
  waitFor(() => expect(queryByTestId(testId)).not.toBeNull());

const pressElement = async (getByTestId: any, testId: string) =>
  act(async () => fireEvent.press(getByTestId(testId)));

const openProposalDetails = async (getByTestId: any, queryByTestId: any, contractId: string) => {
  await waitForElement(queryByTestId, `proposal-row-${contractId}`);
  await pressElement(getByTestId, `proposal-row-${contractId}`);
  await waitForElement(queryByTestId, "pending-transfer-proposals-details");
};

const triggerAction = async (
  getByTestId: any,
  queryByTestId: any,
  contractId: string,
  action: TransferProposalAction,
) => {
  if (action === "withdraw") {
    await waitForElement(queryByTestId, `proposal-row-${contractId}`);
    await waitForElement(queryByTestId, `withdraw-button-${contractId}`);
    await pressElement(getByTestId, `withdraw-button-${contractId}`);
  } else {
    await openProposalDetails(getByTestId, queryByTestId, contractId);
    await waitForElement(queryByTestId, `details-${action}-${contractId}`);
    await pressElement(getByTestId, `details-${action}-${contractId}`);
  }
};

const confirmModal = async (
  getByTestId: any,
  queryByTestId: any,
  action: TransferProposalAction,
) => {
  await waitForElement(queryByTestId, "device-app-modal");
  await waitForElement(queryByTestId, `modal-confirm-${action}`);
  await pressElement(getByTestId, `modal-confirm-${action}`);
  await waitFor(() => expect(mockPerformTransferInstruction).toHaveBeenCalled());
};

const expectTransferInstructionCalled = async (
  contractId: string,
  instructionType: TransferInstructionType,
) =>
  waitFor(() =>
    expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
      { contractId, deviceId: "test-device-id", reason: "" },
      instructionType,
    ),
  );

const expectReonboardingNavigation = async (
  account: CantonAccount,
  action: TransferProposalAction,
  contractId: string,
) =>
  waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith(
      "CantonOnboard",
      expect.objectContaining({
        screen: "CantonOnboardAccount",
        params: expect.objectContaining({
          isReonboarding: true,
          accountToReonboard: account,
          restoreState: expect.objectContaining({
            type: "transfer-proposal",
            action,
            contractId,
          }),
        }),
      }),
    ),
  );

describe("PendingTransferProposals - TopologyChangeError", () => {
  beforeEach(() => jest.clearAllMocks());

  describe.each([
    ["accept", "accept-transfer-instruction", "test-party-id", false],
    ["reject", "reject-transfer-instruction", "test-party-id", false],
    ["withdraw", "withdraw-transfer-instruction", "other-receiver", true],
  ] as [TransferProposalAction, TransferInstructionType, string, boolean][])(
    "TopologyChangeError handling for %s action",
    (action, instructionType, receiver, isOutgoing) => {
      it("should redirect to reonboarding and close modal", async () => {
        const contractId = `contract-${action}`;
        const account = createCantonAccount(contractId, "test-party-id", receiver, isOutgoing);
        mockPerformTransferInstruction.mockRejectedValue(
          new TopologyChangeError("Topology change detected"),
        );

        const { getByTestId, queryByTestId } = renderComponent(account);
        await triggerAction(getByTestId, queryByTestId, contractId, action);
        await confirmModal(getByTestId, queryByTestId, action);
        await expectTransferInstructionCalled(contractId, instructionType);
        await expectReonboardingNavigation(account, action, contractId);

        expect(mockSync).not.toHaveBeenCalled();
        await waitFor(() => expect(queryByTestId("device-app-modal")).toBeNull());
      });
    },
  );

  it("should re-throw non-TopologyChangeError errors", async () => {
    const account = createCantonAccount("contract-123");
    mockPerformTransferInstruction.mockRejectedValue(new Error("Some other error"));
    const { getByTestId, queryByTestId } = renderComponent(account);

    await triggerAction(getByTestId, queryByTestId, "contract-123", "accept");
    await confirmModal(getByTestId, queryByTestId, "accept");
    await waitFor(() => expect(mockPerformTransferInstruction).toHaveBeenCalled());

    expect(mockNavigate).not.toHaveBeenCalled();
    await waitFor(
      () => {
        expect(queryByTestId("device-app-modal")).not.toBeNull();
        expect(queryByTestId("device-app-modal-error")).not.toBeNull();
      },
      { timeout: 2000 },
    );
  });

  it("should call sync after successful transfer instruction", async () => {
    const account = createCantonAccount("contract-123");
    mockPerformTransferInstruction.mockResolvedValue(undefined);
    const { getByTestId, queryByTestId } = renderComponent(account);

    await triggerAction(getByTestId, queryByTestId, "contract-123", "accept");
    await confirmModal(getByTestId, queryByTestId, "accept");
    await waitFor(() => expect(mockPerformTransferInstruction).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockSync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        accountId: account.id,
        priority: 10,
        reason: "canton-pending-transaction-action",
      }),
    );
    await waitFor(() => expect(queryByTestId("device-app-modal-success")).not.toBeNull());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
