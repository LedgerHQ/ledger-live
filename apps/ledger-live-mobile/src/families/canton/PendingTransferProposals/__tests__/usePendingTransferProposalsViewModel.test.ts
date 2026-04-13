/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */
import { TopologyChangeError } from "@ledgerhq/coin-canton/types/errors";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { act, renderHook, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { usePendingTransferProposalsViewModel } from "../usePendingTransferProposalsViewModel";
import {
  ACCOUNT_XPUB,
  createCantonAccount,
  createMockNavigation,
  createMockRoute,
  createRawProposal,
} from "./test-utils";

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/featureFlags/index"),
  useFeature: jest.fn(),
}));

const mockUseFeature = useFeature as jest.MockedFunction<typeof useFeature>;

describe("usePendingTransferProposalsViewModel", () => {
  const account = createCantonAccount();
  const parentAccount = createCantonAccount();
  const mockNavigation = createMockNavigation();
  const mockRoute = createMockRoute();
  const mockPerformTransferInstruction = jest.fn().mockResolvedValue(undefined);
  const mockSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (overrideAccount = account) =>
    renderHook(() =>
      usePendingTransferProposalsViewModel({
        account: overrideAccount,
        parentAccount,
        navigation: mockNavigation as any,
        route: mockRoute as any,
        performTransferInstruction: mockPerformTransferInstruction,
        sync: mockSync,
      }),
    );

  describe("proposal grouping", () => {
    it("should return empty proposals for an account with no pending transfer proposals", () => {
      const { result } = renderViewModel();

      expect(result.current.incomingCount).toBe(0);
      expect(result.current.outgoingCount).toBe(0);
      expect(result.current.groupedIncoming).toEqual([]);
      expect(result.current.groupedOutgoing).toEqual([]);
    });

    it("should separate incoming proposals from outgoing proposals", () => {
      const accountWithProposals = createCantonAccount({
        cantonResources: {
          isOnboarded: true,
          instrumentUtxoCounts: {},
          xpub: ACCOUNT_XPUB,
          pendingTransferProposals: [
            createRawProposal("incoming-contract", "other-xpub", ACCOUNT_XPUB),
            createRawProposal("outgoing-contract", ACCOUNT_XPUB, "other-xpub"),
          ],
        } as any,
      });

      const { result } = renderViewModel(accountWithProposals);

      expect(result.current.incomingCount).toBe(1);
      expect(result.current.outgoingCount).toBe(1);
    });

    it("should group multiple proposals by day", () => {
      const now = Date.now();
      const tomorrow = now + 86400000;
      const accountWithProposals = createCantonAccount({
        cantonResources: {
          isOnboarded: true,
          instrumentUtxoCounts: {},
          xpub: ACCOUNT_XPUB,
          pendingTransferProposals: [
            createRawProposal("contract-1", "other-xpub", ACCOUNT_XPUB, {
              expires_at_micros: now * 1000 + 3600000000,
            }),
            createRawProposal("contract-2", "other-xpub", ACCOUNT_XPUB, {
              expires_at_micros: tomorrow * 1000 + 3600000000,
            }),
          ],
        } as any,
      });

      const { result } = renderViewModel(accountWithProposals);

      expect(result.current.incomingCount).toBe(2);
      expect(result.current.groupedIncoming.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("modal state", () => {
    it("should initialize modal as closed", () => {
      const { result } = renderViewModel();

      expect(result.current.modal.isOpen).toBe(false);
    });

    it("should open modal with the correct action and contractId when onOpenModal is called", () => {
      const { result } = renderViewModel();

      act(() => {
        result.current.onOpenModal("contract-123", "accept");
      });

      expect(result.current.modal.isOpen).toBe(true);
      expect(result.current.modal.action).toBe("accept");
      expect(result.current.modal.contractId).toBe("contract-123");
    });

    it("should close modal while preserving contractId when onModalClose is called", () => {
      const { result } = renderViewModel();

      act(() => {
        result.current.onOpenModal("contract-123", "reject");
      });

      act(() => {
        result.current.onModalClose();
      });

      expect(result.current.modal.isOpen).toBe(false);
      expect(result.current.modal.contractId).toBe("contract-123");
    });
  });

  describe("details drawer state", () => {
    it("should initialize details drawer as closed", () => {
      const { result } = renderViewModel();

      expect(result.current.isDetailsOpen).toBe(false);
      expect(result.current.selectedProposal).toBeNull();
    });

    it("should open details drawer with the correct contractId when onRowClick is called", () => {
      const accountWithProposal = createCantonAccount({
        cantonResources: {
          isOnboarded: true,
          instrumentUtxoCounts: {},
          xpub: ACCOUNT_XPUB,
          pendingTransferProposals: [createRawProposal("contract-123", "other-xpub", ACCOUNT_XPUB)],
        } as any,
      });

      const { result } = renderViewModel(accountWithProposal);

      act(() => {
        result.current.onRowClick("contract-123");
      });

      expect(result.current.isDetailsOpen).toBe(true);
      expect(result.current.selectedProposal?.contractId).toBe("contract-123");
    });

    it("should close details drawer when onDetailsClose is called", () => {
      const { result } = renderViewModel();

      act(() => {
        result.current.onRowClick("contract-123");
      });

      act(() => {
        result.current.onDetailsClose();
      });

      expect(result.current.isDetailsOpen).toBe(false);
    });

    it("should close details drawer when modal is opened via onOpenModal", () => {
      const { result } = renderViewModel();

      act(() => {
        result.current.onRowClick("contract-123");
      });

      expect(result.current.isDetailsOpen).toBe(true);

      act(() => {
        result.current.onOpenModal("contract-123", "accept");
      });

      expect(result.current.isDetailsOpen).toBe(false);
      expect(result.current.modal.isOpen).toBe(true);
    });
  });

  describe("account and appName", () => {
    it("should return the account passed as input", () => {
      const { result } = renderViewModel();

      expect(result.current.account).toBe(account);
    });

    it("should derive appName from the parent account currency", () => {
      const { result } = renderViewModel();

      expect(result.current.appName).toBe("Canton");
    });
  });

  describe("onDeviceConfirm", () => {
    it("should call performTransferInstruction with correct params and trigger sync on success", async () => {
      const { result } = renderViewModel();

      act(() => {
        result.current.onOpenModal("contract-abc", "accept");
      });

      await act(async () => {
        await result.current.onDeviceConfirm("device-1");
      });

      expect(mockPerformTransferInstruction).toHaveBeenCalledWith(
        { contractId: "contract-abc", deviceId: "device-1", reason: "" },
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

    it("should close modal and open reonboard drawer on TopologyChangeError when llmModularDrawer is enabled", async () => {
      mockUseFeature.mockReturnValue({ enabled: true } as any);
      mockPerformTransferInstruction.mockRejectedValueOnce(new TopologyChangeError());
      const { result } = renderViewModel();

      act(() => {
        result.current.onOpenModal("contract-abc", "accept");
      });

      await act(async () => {
        await result.current.onDeviceConfirm("device-1");
      });

      expect(result.current.modal.isOpen).toBe(false);
      expect(result.current.reonboardDrawer.isOpen).toBe(true);
      expect(result.current.reonboardDrawer.restoreState).toBeDefined();
    });

    it("should close modal and navigate to legacy onboard screen on TopologyChangeError when llmModularDrawer is disabled", async () => {
      mockUseFeature.mockReturnValue(null);
      mockPerformTransferInstruction.mockRejectedValueOnce(new TopologyChangeError());
      const { result } = renderViewModel();

      act(() => {
        result.current.onOpenModal("contract-abc", "accept");
      });

      await act(async () => {
        await result.current.onDeviceConfirm("device-1");
      });

      expect(result.current.modal.isOpen).toBe(false);
      expect(result.current.reonboardDrawer.isOpen).toBe(false);
      expect(mockNavigation.navigate).toHaveBeenCalledWith(NavigatorName.CantonOnboard, {
        screen: ScreenName.CantonOnboardAccount,
        params: expect.objectContaining({
          isReonboarding: true,
          accountToReonboard: account,
        }),
      });
    });

    it("should re-throw non-TopologyChangeError errors", async () => {
      const genericError = new Error("network failure");
      mockPerformTransferInstruction.mockRejectedValueOnce(genericError);
      const { result } = renderViewModel();

      act(() => {
        result.current.onOpenModal("contract-abc", "reject");
      });

      await expect(
        act(async () => {
          await result.current.onDeviceConfirm("device-1");
        }),
      ).rejects.toThrow("network failure");
    });
  });

  describe("restore modal state", () => {
    it("should reopen the modal when route params contain a valid restoreModalState", async () => {
      const mutableParams: Record<string, unknown> = {
        restoreModalState: { action: "accept", contractId: "restored-contract" },
      };
      const routeWithRestore = { name: "Account", key: "Account-key", params: mutableParams };

      mockNavigation.setParams.mockImplementation((newParams: Record<string, unknown>) => {
        Object.assign(mutableParams, newParams);
      });

      const { result, rerender } = renderHook(() =>
        usePendingTransferProposalsViewModel({
          account,
          parentAccount,
          navigation: mockNavigation as any,
          route: routeWithRestore as any,
          performTransferInstruction: mockPerformTransferInstruction,
          sync: mockSync,
        }),
      );

      expect(mockNavigation.setParams).toHaveBeenCalledWith({
        restoreModalState: undefined,
      });

      rerender({});

      await waitFor(() => {
        expect(result.current.modal.isOpen).toBe(true);
      });

      expect(result.current.modal.action).toBe("accept");
      expect(result.current.modal.contractId).toBe("restored-contract");
    });

    it("should not open the modal when route params contain an invalid restoreModalState", () => {
      const routeWithInvalid = createMockRoute({
        restoreModalState: { action: "invalid", contractId: "contract-1" },
      });

      const { result } = renderHook(() =>
        usePendingTransferProposalsViewModel({
          account,
          parentAccount,
          navigation: mockNavigation as any,
          route: routeWithInvalid as any,
          performTransferInstruction: mockPerformTransferInstruction,
          sync: mockSync,
        }),
      );

      expect(result.current.modal.isOpen).toBe(false);
      expect(mockNavigation.setParams).not.toHaveBeenCalled();
    });
  });
});
