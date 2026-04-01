import { act, renderHook } from "tests/testSetup";
import { createMockAccount, createProcessedProposal } from "./test-utils";
import { usePendingTransferProposalsDetailsViewModel } from "../usePendingTransferProposalsDetailsViewModel";

describe("usePendingTransferProposalsDetailsViewModel", () => {
  const account = createMockAccount();
  const mockOnOpenModal = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (proposal = createProcessedProposal()) =>
    renderHook(() =>
      usePendingTransferProposalsDetailsViewModel({
        account,
        proposal,
        onOpenModal: mockOnOpenModal,
        onClose: mockOnClose,
      }),
    );

  it("should return the unit derived from the account", () => {
    const { result } = renderViewModel();

    expect(result.current.unit).toBeDefined();
    expect(result.current.unit.code).toBe("CANTON");
  });

  it("should return the proposal as a pass-through", () => {
    const proposal = createProcessedProposal({ contractId: "contract-pass" });
    const { result } = renderViewModel(proposal);

    expect(result.current.proposal).toBe(proposal);
  });

  it("should return null proposal when input is null", () => {
    const { result } = renderHook(() =>
      usePendingTransferProposalsDetailsViewModel({
        account,
        proposal: null,
        onOpenModal: mockOnOpenModal,
        onClose: mockOnClose,
      }),
    );

    expect(result.current.proposal).toBeNull();
  });

  it("should return an empty string for timeRemaining when proposal is expired", () => {
    const expired = createProcessedProposal({ isExpired: true });
    const { result } = renderViewModel(expired);

    expect(result.current.timeRemaining).toBe("");
  });

  it("should return an empty string for timeRemaining when proposal is null", () => {
    const { result } = renderHook(() =>
      usePendingTransferProposalsDetailsViewModel({
        account,
        proposal: null,
        onOpenModal: mockOnOpenModal,
        onClose: mockOnClose,
      }),
    );

    expect(result.current.timeRemaining).toBe("");
  });

  it("should call onOpenModal with the proposal contractId and the given action", () => {
    const proposal = createProcessedProposal({ contractId: "contract-xyz" });
    const { result } = renderViewModel(proposal);

    act(() => {
      result.current.handleAction("accept");
    });

    expect(mockOnOpenModal).toHaveBeenCalledWith("contract-xyz", "accept");
  });

  it("should call onOpenModal with the reject action", () => {
    const proposal = createProcessedProposal({ contractId: "contract-xyz" });
    const { result } = renderViewModel(proposal);

    act(() => {
      result.current.handleAction("reject");
    });

    expect(mockOnOpenModal).toHaveBeenCalledWith("contract-xyz", "reject");
  });

  it("should call onClose after opening modal", () => {
    const proposal = createProcessedProposal({ contractId: "contract-123" });
    const { result } = renderViewModel(proposal);

    act(() => {
      result.current.handleAction("accept");
    });

    expect(mockOnOpenModal).toHaveBeenCalledWith("contract-123", "accept");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not call onOpenModal when proposal is null", () => {
    const { result } = renderHook(() =>
      usePendingTransferProposalsDetailsViewModel({
        account,
        proposal: null,
        onOpenModal: mockOnOpenModal,
        onClose: mockOnClose,
      }),
    );

    act(() => {
      result.current.handleAction("withdraw");
    });

    expect(mockOnOpenModal).not.toHaveBeenCalled();
  });
});
