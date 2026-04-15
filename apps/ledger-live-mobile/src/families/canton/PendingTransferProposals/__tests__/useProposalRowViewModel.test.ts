import { act, renderHook } from "@tests/test-renderer";
import { BigNumber } from "bignumber.js";
import { useProposalRowViewModel } from "../components/useProposalRowViewModel";
import { createProcessedProposal } from "./test-utils";

describe("useProposalRowViewModel", () => {
  const onRowClick = jest.fn();
  const onOpenModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderViewModel = (overrides = {}) =>
    renderHook(() =>
      useProposalRowViewModel({
        proposal: createProcessedProposal(overrides),
        onRowClick,
        onOpenModal,
      }),
    );

  describe("addressToShow", () => {
    it("should show the sender address for an incoming proposal", () => {
      const { result } = renderViewModel({ isIncoming: true, sender: "alice-xpub" });

      expect(result.current.addressToShow).toBe("alice-xpub");
    });

    it("should show the receiver address for an outgoing proposal", () => {
      const { result } = renderViewModel({ isIncoming: false, receiver: "bob-xpub" });

      expect(result.current.addressToShow).toBe("bob-xpub");
    });
  });

  describe("amountValue", () => {
    it("should return a positive amount for an incoming proposal", () => {
      const { result } = renderViewModel({
        isIncoming: true,
        amount: new BigNumber("500000"),
      });

      expect(result.current.amountValue.isPositive()).toBe(true);
      expect(result.current.amountValue.toFixed()).toBe("500000");
    });

    it("should return a negated amount for an outgoing proposal", () => {
      const { result } = renderViewModel({
        isIncoming: false,
        amount: new BigNumber("500000"),
      });

      expect(result.current.amountValue.isNegative()).toBe(true);
      expect(result.current.amountValue.toFixed()).toBe("-500000");
    });
  });

  describe("amountColor", () => {
    it("should return success color for an incoming proposal", () => {
      const { result } = renderViewModel({ isIncoming: true });

      expect(result.current.amountColor).toBe("success.c50");
    });

    it("should return error color for an outgoing proposal", () => {
      const { result } = renderViewModel({ isIncoming: false });

      expect(result.current.amountColor).toBe("error.c50");
    });
  });

  describe("timeRemaining", () => {
    it("should return an empty string for an expired proposal", () => {
      const { result } = renderViewModel({ isExpired: true });

      expect(result.current.timeRemaining).toBe("");
    });
  });

  describe("handleRowPress", () => {
    it("should call onRowClick with the proposal contractId", () => {
      const { result } = renderViewModel({ contractId: "contract-abc" });

      act(() => {
        result.current.handleRowPress();
      });

      expect(onRowClick).toHaveBeenCalledWith("contract-abc");
    });
  });

  describe("handleWithdrawPress", () => {
    it("should call onOpenModal with the contractId and withdraw action", () => {
      const { result } = renderViewModel({ contractId: "contract-abc" });

      act(() => {
        result.current.handleWithdrawPress();
      });

      expect(onOpenModal).toHaveBeenCalledWith("contract-abc", "withdraw");
    });
  });
});
