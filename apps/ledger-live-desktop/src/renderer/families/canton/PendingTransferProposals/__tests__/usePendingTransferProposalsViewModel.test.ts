/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TopologyChangeError } from "@ledgerhq/coin-canton";
import { useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import { useCantonAcceptOrRejectOffer } from "@ledgerhq/live-common/families/canton/react";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";
import { act, renderHook, waitFor } from "tests/testSetup";
import { State } from "~/renderer/reducers";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { createMockAccount } from "../../__tests__/testUtils";
import { handleTopologyChangeError } from "../../hooks/topologyChangeError";
import { createMockDevice } from "../../OnboardModal/__tests__/testUtils";
import { usePendingTransferProposalsViewModel } from "../usePendingTransferProposalsViewModel";

jest.mock("@ledgerhq/live-common/families/canton/react");
jest.mock("@ledgerhq/live-common/bridge/react/index");
jest.mock("../../hooks/topologyChangeError", () => ({
  __esModule: true,
  handleTopologyChangeError: jest.fn(),
  TopologyChangeError: jest.requireActual("@ledgerhq/coin-canton").TopologyChangeError,
}));

const mockUseCantonAcceptOrRejectOffer = jest.mocked(useCantonAcceptOrRejectOffer);
const mockUseBridgeSync = jest.mocked(useBridgeSync);
const mockHandleTopologyChangeError = jest.mocked(handleTopologyChangeError);

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
      isOnboarded: true,
      instrumentUtxoCounts: {},
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

describe("usePendingTransferProposalsViewModel", () => {
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
    mockHandleTopologyChangeError.mockReturnValue(true);
  });

  it("should sync account after successful action", async () => {
    mockPerformTransferInstruction.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => usePendingTransferProposalsViewModel(mockAccount, mockAccount),
      { initialState: buildInitialState() },
    );

    act(() => {
      result.current.onOpenModal("contract-123", "accept");
    });

    await act(async () => {
      await result.current.onDeviceConfirm("device-id");
    });

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

      const { result } = renderHook(
        () => usePendingTransferProposalsViewModel(account, mockAccount),
        { initialState: buildInitialState() },
      );

      act(() => {
        result.current.onOpenModal(contractId, action as "accept" | "reject" | "withdraw");
      });

      await act(async () => {
        await result.current.onDeviceConfirm("device-id");
      });

      await waitFor(() => {
        expect(mockHandleTopologyChangeError).toHaveBeenCalledWith(
          expect.any(Function),
          expect.objectContaining({
            currency: mockAccount.currency,
            device: mockDevice,
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

      const { result } = renderHook(
        () => usePendingTransferProposalsViewModel(mockAccount, mockAccount),
        {
          initialState: buildInitialState({
            devices: {
              currentDevice: null,
              devices: [],
            },
          }),
        },
      );

      act(() => {
        result.current.onOpenModal("contract-123", "accept");
      });

      await act(async () => {
        await result.current.onDeviceConfirm("device-id");
      });

      await waitFor(() => {
        expect(mockHandleTopologyChangeError).not.toHaveBeenCalled();
      });
    });
  });

  describe("proposal processing", () => {
    it("should categorise incoming and outgoing proposals correctly", () => {
      const accountWithBoth = createMockAccount({
        xpub: "test-xpub",
        cantonResources: {
          isOnboarded: true,
          instrumentUtxoCounts: {},
          pendingTransferProposals: [
            {
              contract_id: "incoming-1",
              sender: "other-party",
              receiver: "test-xpub",
              amount: "500000",
              memo: "",
              expires_at_micros: Date.now() * 1000 + 3600000000,
            },
            {
              contract_id: "outgoing-1",
              sender: "test-xpub",
              receiver: "other-party",
              amount: "750000",
              memo: "",
              expires_at_micros: Date.now() * 1000 + 7200000000,
            },
          ],
        },
      } as Partial<CantonAccount>);

      const { result } = renderHook(
        () => usePendingTransferProposalsViewModel(accountWithBoth, accountWithBoth),
        { initialState: buildInitialState() },
      );

      expect(result.current.incomingCount).toBe(1);
      expect(result.current.outgoingCount).toBe(1);
    });

    it("should return zero counts for empty proposals", () => {
      const emptyAccount = createMockAccount({
        xpub: "test-xpub",
        cantonResources: {
          isOnboarded: false,
          instrumentUtxoCounts: {},
          pendingTransferProposals: [],
        },
      } as Partial<CantonAccount>);

      const { result } = renderHook(
        () => usePendingTransferProposalsViewModel(emptyAccount, emptyAccount),
        { initialState: buildInitialState() },
      );

      expect(result.current.incomingCount).toBe(0);
      expect(result.current.outgoingCount).toBe(0);
    });
  });

  describe("modal state", () => {
    it("should open modal with correct action and contractId", () => {
      const { result } = renderHook(
        () => usePendingTransferProposalsViewModel(mockAccount, mockAccount),
        { initialState: buildInitialState() },
      );

      expect(result.current.modal.isOpen).toBe(false);

      act(() => {
        result.current.onOpenModal("contract-123", "reject");
      });

      expect(result.current.modal).toEqual({
        isOpen: true,
        action: "reject",
        contractId: "contract-123",
      });
    });

    it("should close modal when onModalClose is called", () => {
      const { result } = renderHook(
        () => usePendingTransferProposalsViewModel(mockAccount, mockAccount),
        { initialState: buildInitialState() },
      );

      act(() => {
        result.current.onOpenModal("contract-123", "accept");
      });

      expect(result.current.modal.isOpen).toBe(true);

      act(() => {
        result.current.onModalClose();
      });

      expect(result.current.modal.isOpen).toBe(false);
    });
  });
});
