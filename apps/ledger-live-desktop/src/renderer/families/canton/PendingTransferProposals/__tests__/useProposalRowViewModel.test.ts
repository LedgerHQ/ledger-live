import type { Unit } from "@ledgerhq/types-cryptoassets";
import { renderHook, act } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import { useProposalRowViewModel } from "../components/useProposalRowViewModel";
import { createProcessedProposal } from "./test-utils";

const unit: Unit = { code: "CANTON", magnitude: 38, name: "Canton" };

describe("useProposalRowViewModel", () => {
  const mockOnRowClick = jest.fn();
  const mockOnOpenModal = jest.fn();

  const renderVM = (proposal = createProcessedProposal()) =>
    renderHook(() =>
      useProposalRowViewModel({
        proposal,
        unit,
        onRowClick: mockOnRowClick,
        onOpenModal: mockOnOpenModal,
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should pass through proposal and unit", () => {
    const proposal = createProcessedProposal({ contractId: "contract-pass" });
    const { result } = renderVM(proposal);

    expect(result.current.proposal).toBe(proposal);
    expect(result.current.unit).toBe(unit);
  });

  it("should resolve addressToShow to sender for incoming proposals", () => {
    const proposal = createProcessedProposal({
      isIncoming: true,
      sender: "sender-xpub",
      receiver: "receiver-xpub",
    });

    const { result } = renderVM(proposal);

    expect(result.current.addressToShow).toBe("sender-xpub");
  });

  it("should resolve addressToShow to receiver for outgoing proposals", () => {
    const proposal = createProcessedProposal({
      isIncoming: false,
      sender: "sender-xpub",
      receiver: "receiver-xpub",
    });

    const { result } = renderVM(proposal);

    expect(result.current.addressToShow).toBe("receiver-xpub");
  });

  it("should return positive amountValue for incoming proposals", () => {
    const proposal = createProcessedProposal({
      isIncoming: true,
      amount: new BigNumber("1000000"),
    });

    const { result } = renderVM(proposal);

    expect(result.current.amountValue.isPositive()).toBe(true);
  });

  it("should return negated amountValue for outgoing proposals", () => {
    const proposal = createProcessedProposal({
      isIncoming: false,
      amount: new BigNumber("1000000"),
    });

    const { result } = renderVM(proposal);

    expect(result.current.amountValue.isNegative()).toBe(true);
  });

  it("should call onRowClick with contractId on handleRowClick", () => {
    const proposal = createProcessedProposal({ contractId: "contract-abc" });

    const { result } = renderVM(proposal);

    act(() => {
      result.current.handleRowClick();
    });

    expect(mockOnRowClick).toHaveBeenCalledWith("contract-abc");
  });

  it("should call onOpenModal with accept on handleAcceptClick when not expired", () => {
    const proposal = createProcessedProposal({
      contractId: "contract-abc",
      isExpired: false,
    });
    const mockEvent = { stopPropagation: jest.fn() } as unknown as React.MouseEvent;

    const { result } = renderVM(proposal);

    act(() => {
      result.current.handleAcceptClick(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockOnOpenModal).toHaveBeenCalledWith("contract-abc", "accept");
  });

  it("should not call onOpenModal on handleAcceptClick when expired", () => {
    const proposal = createProcessedProposal({
      contractId: "contract-abc",
      isExpired: true,
    });
    const mockEvent = { stopPropagation: jest.fn() } as unknown as React.MouseEvent;

    const { result } = renderVM(proposal);

    act(() => {
      result.current.handleAcceptClick(mockEvent);
    });

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockOnOpenModal).not.toHaveBeenCalled();
  });

  it("should call onOpenModal with withdraw on handleWithdrawClick", () => {
    const proposal = createProcessedProposal({
      contractId: "contract-abc",
      isIncoming: false,
    });
    const mockEvent = { stopPropagation: jest.fn() } as unknown as React.MouseEvent;

    const { result } = renderVM(proposal);

    act(() => {
      result.current.handleWithdrawClick(mockEvent);
    });

    expect(mockOnOpenModal).toHaveBeenCalledWith("contract-abc", "withdraw");
  });
});
