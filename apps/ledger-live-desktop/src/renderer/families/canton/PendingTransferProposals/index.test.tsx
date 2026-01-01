/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import { TopologyChangeError } from "@ledgerhq/coin-canton";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCantonAcceptOrRejectOffer } from "@ledgerhq/live-common/families/canton/react";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import React from "react";
import { fireEvent, render, screen, waitFor } from "tests/testSetup";
import { State } from "~/renderer/reducers";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { createMockAccount } from "../__tests__/testUtils";
import { handleTopologyChangeError } from "../hooks/topologyChangeError";
import { createMockDevice } from "../OnboardModal/__tests__/testUtils";
import PendingTransferProposals from "./index";

const mockDispatch = jest.fn();
jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
}));
jest.mock("@ledgerhq/live-common/families/canton/react");
jest.mock("@ledgerhq/live-common/bridge/react/index");
jest.mock("~/renderer/reducers/devices", () => {
  const actual = jest.requireActual("~/renderer/reducers/devices");
  return {
    __esModule: true,
    ...actual,
    getCurrentDevice: jest.fn(),
  };
});
jest.mock("../hooks/topologyChangeError", () => ({
  __esModule: true,
  handleTopologyChangeError: jest.fn(),
  TopologyChangeError: jest.requireActual("@ledgerhq/coin-canton").TopologyChangeError,
}));
jest.mock("./DeviceAppModal", () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="device-app-modal">
        <button data-testid="modal-confirm" onClick={() => onConfirm("device-id")}>
          Confirm
        </button>
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({ code: "AMU", magnitude: 18, name: "Amulet" })),
}));
jest.mock("~/renderer/components/OperationsList/AddressCell", () => ({
  __esModule: true,
  default: () => <div data-testid="address-cell" />,
  splitAddress: (value: string) => ({ left: value.slice(0, 5), right: value.slice(5) }),
  SplitAddress: ({ value }: { value: string }) => (
    <span data-testid={`address-${value}`}>{value}</span>
  ),
  Address: ({ value }: { value: string }) => <span data-testid={`address-${value}`}>{value}</span>,
  Cell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("./PendingTransferProposalsDetails", () => ({
  __esModule: true,
  default: ({ account, contractId, onOpenModal }: any) => (
    <div data-testid="pending-transfer-proposals-details">
      <div>Account: {account.id}</div>
      <div>Contract: {contractId}</div>
      <button onClick={() => onOpenModal?.(contractId, "accept")}>Accept</button>
      <button onClick={() => onOpenModal?.(contractId, "reject")}>Reject</button>
      <button onClick={() => onOpenModal?.(contractId, "withdraw")}>Withdraw</button>
    </div>
  ),
}));

const mockUseCantonAcceptOrRejectOffer = useCantonAcceptOrRejectOffer as jest.MockedFunction<
  typeof useCantonAcceptOrRejectOffer
>;
const mockUseBridgeSync = useBridgeSync as jest.MockedFunction<typeof useBridgeSync>;
const mockGetCurrentDevice = getCurrentDevice as jest.MockedFunction<typeof getCurrentDevice>;
const mockHandleTopologyChangeError = handleTopologyChangeError as jest.MockedFunction<
  typeof handleTopologyChangeError
>;

const mockSync = jest.fn();
const mockPerformTransferInstruction = jest.fn();

const createAccountWithProposal = (
  contractId: string,
  sender: string,
  receiver: string,
  overrides?: Partial<CantonAccount["cantonResources"]["pendingTransferProposals"][0]>,
) =>
  createMockAccount({
    xpub: "test-xpub",
    cantonResources: {
      pendingTransferProposals: [
        {
          contract_id: contractId,
          sender,
          receiver,
          amount: "1000000",
          memo: "Test memo",
          expires_at_micros: Date.now() * 1000 + 3600000000,
          ...overrides,
        },
      ],
    },
  } as Partial<CantonAccount>);

describe("PendingTransferProposals", () => {
  const mockAccount = createAccountWithProposal("contract-123", "sender-address", "test-xpub");
  const mockDevice = createMockDevice({ deviceId: "device-1" });
  const buildInitialState: (overrides?: Partial<State>) => Partial<State> = (overrides = {}) => ({
    settings: { ...SETTINGS_INITIAL_STATE },
    devices: {
      currentDevice: mockDevice,
      devices: [mockDevice],
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCantonAcceptOrRejectOffer.mockReturnValue(mockPerformTransferInstruction);
    mockUseBridgeSync.mockReturnValue(mockSync);
    mockGetCurrentDevice.mockReturnValue(mockDevice);
    mockHandleTopologyChangeError.mockReturnValue(true);
  });

  it("should sync account after successful action", async () => {
    mockPerformTransferInstruction.mockResolvedValue(undefined);

    render(<PendingTransferProposals account={mockAccount} parentAccount={mockAccount} />, {
      initialState: buildInitialState(),
    });
    fireEvent.click(screen.getByText("families.canton.pendingTransactions.accept"));
    fireEvent.click(await screen.findByTestId("modal-confirm"));

    await waitFor(() => {
      expect(mockSync).toHaveBeenCalledWith({
        type: "SYNC_ONE_ACCOUNT",
        accountId: mockAccount.id,
        priority: 10,
        reason: "canton-pending-transaction-action",
      });
    });
    expect(mockHandleTopologyChangeError).not.toHaveBeenCalled();
  });

  describe("TopologyChangeError", () => {
    it.each([
      ["accept", "contract-123", mockAccount],
      ["reject", "contract-123", mockAccount],
      [
        "withdraw",
        "contract-456",
        createAccountWithProposal("contract-456", "test-xpub", "receiver-address", {
          amount: "2000000",
          memo: "",
        }),
      ],
    ])("should handle during %s action", async (action, contractId, account) => {
      mockPerformTransferInstruction.mockRejectedValue(
        new TopologyChangeError("Topology change detected"),
      );

      render(<PendingTransferProposals account={account} parentAccount={mockAccount} />, {
        initialState: buildInitialState(),
      });
      const buttonText =
        action === "withdraw" ? "common.cancel" : `families.canton.pendingTransactions.${action}`;
      fireEvent.click(screen.getByText(buttonText));
      fireEvent.click(await screen.findByTestId("modal-confirm"));

      await waitFor(() => {
        expect(mockHandleTopologyChangeError).toHaveBeenCalledWith(
          mockDispatch,
          expect.objectContaining({
            currency: mockAccount.currency,
            device: mockDevice,
            accounts: [],
            mainAccount: mockAccount,
            navigationSnapshot: expect.objectContaining({
              type: "transfer-proposal",
              handler: expect.any(Function),
              props: expect.objectContaining({
                action,
                contractId,
              }),
            }),
          }),
        );
      });
      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should not call handleTopologyChangeError when device is missing", async () => {
      mockPerformTransferInstruction.mockRejectedValue(
        new TopologyChangeError("Topology change detected"),
      );
      mockGetCurrentDevice.mockReturnValue(null);

      render(<PendingTransferProposals account={mockAccount} parentAccount={mockAccount} />, {
        initialState: buildInitialState({
          devices: {
            currentDevice: null,
            devices: [],
          },
        }),
      });
      fireEvent.click(screen.getByText("families.canton.pendingTransactions.accept"));
      fireEvent.click(await screen.findByTestId("modal-confirm"));

      await waitFor(() => {
        expect(mockHandleTopologyChangeError).not.toHaveBeenCalled();
      });
    });
  });
});
