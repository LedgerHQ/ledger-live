import { act, renderHook } from "@tests/test-renderer";
import { usePendingTransferProposalsDetailsViewModel } from "../usePendingTransferProposalsDetailsViewModel";
import { createCantonAccount, createProcessedProposal } from "./test-utils";

describe("usePendingTransferProposalsDetailsViewModel", () => {
  const account = createCantonAccount();
  const onOpenModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (proposal = createProcessedProposal()) =>
    renderHook(() =>
      usePendingTransferProposalsDetailsViewModel({ account, proposal, onOpenModal }),
    );

  describe("unit", () => {
    it("should return the unit derived from the account", () => {
      const { result } = renderViewModel();

      expect(result.current.unit).toBeDefined();
      expect(result.current.unit.code).toBe("CANTON");
    });
  });

  describe("timeRemaining", () => {
    it("should return an empty string for an expired proposal", () => {
      const expired = createProcessedProposal({ isExpired: true });
      const { result } = renderViewModel(expired);

      expect(result.current.timeRemaining).toBe("");
    });

    it("should return an empty string when proposal is null", () => {
      const { result } = renderHook(() =>
        usePendingTransferProposalsDetailsViewModel({ account, proposal: null, onOpenModal }),
      );

      expect(result.current.timeRemaining).toBe("");
    });
  });

  describe("handleAction", () => {
    it("should call onOpenModal with the proposal contractId and the given action", () => {
      const proposal = createProcessedProposal({ contractId: "contract-xyz" });
      const { result } = renderViewModel(proposal);

      act(() => {
        result.current.handleAction("accept");
      });

      expect(onOpenModal).toHaveBeenCalledWith("contract-xyz", "accept");
    });

    it("should call onOpenModal with the reject action", () => {
      const proposal = createProcessedProposal({ contractId: "contract-xyz" });
      const { result } = renderViewModel(proposal);

      act(() => {
        result.current.handleAction("reject");
      });

      expect(onOpenModal).toHaveBeenCalledWith("contract-xyz", "reject");
    });

    it("should not call onOpenModal when proposal is null", () => {
      const { result } = renderHook(() =>
        usePendingTransferProposalsDetailsViewModel({ account, proposal: null, onOpenModal }),
      );

      act(() => {
        result.current.handleAction("withdraw");
      });

      expect(onOpenModal).not.toHaveBeenCalled();
    });
  });
});
