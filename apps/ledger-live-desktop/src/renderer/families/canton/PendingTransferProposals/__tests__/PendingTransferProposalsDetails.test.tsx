import type { Unit } from "@ledgerhq/types-cryptoassets";
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { View } from "../PendingTransferProposalsDetails";
import type { PendingTransferProposalsDetailsViewModel } from "../usePendingTransferProposalsDetailsViewModel";
import { createProcessedProposal } from "./test-utils";

const unit: Unit = { code: "CANTON", magnitude: 38, name: "Canton" };

const buildViewModel = (
  overrides?: Partial<PendingTransferProposalsDetailsViewModel>,
): PendingTransferProposalsDetailsViewModel => ({
  proposal: createProcessedProposal(),
  unit,
  dateFormatted: "2025-06-15",
  timeRemaining: "1h 00m 00s",
  handleAction: jest.fn(),
  ...overrides,
});

describe("PendingTransferProposalsDetails View", () => {
  describe("when proposal exists", () => {
    it("should render proposal details for incoming transaction", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        sender: "sender-address",
        receiver: "receiver-address",
        isIncoming: true,
        memo: "Test memo",
      });

      const { container } = render(<View {...buildViewModel({ proposal })} />);

      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(screen.getByText("From")).toBeInTheDocument();
      expect(screen.getByText("To")).toBeInTheDocument();
      expect(container.textContent).toContain("sender-address");
      expect(container.textContent).toContain("receiver-address");
    });

    it("should render proposal details for outgoing transaction", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-789",
        sender: "receiver-address",
        receiver: "other-receiver",
        isIncoming: false,
        memo: "Outgoing memo",
      });

      const { container } = render(<View {...buildViewModel({ proposal })} />);

      expect(screen.getByText("Amount")).toBeInTheDocument();
      expect(container.textContent).toContain("receiver-address");
      expect(container.textContent).toContain("other-receiver");
    });

    it("should display memo when present", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        memo: "Test memo",
      });

      render(<View {...buildViewModel({ proposal })} />);

      expect(screen.getByText("Memo")).toBeInTheDocument();
      expect(screen.getByText("Test memo")).toBeInTheDocument();
    });

    it("should not display memo section when memo is empty", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-456",
        memo: "",
        isIncoming: true,
        isExpired: true,
      });

      render(<View {...buildViewModel({ proposal })} />);

      expect(screen.queryByText("Memo")).not.toBeInTheDocument();
    });

    it("should display contract ID", () => {
      const proposal = createProcessedProposal({ contractId: "contract-123" });

      const { container } = render(<View {...buildViewModel({ proposal })} />);

      expect(container.textContent).toContain("contract-123");
      expect(screen.getAllByText("Copy").length).toBeGreaterThan(0);
    });

    it("should display expired status for expired proposals", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-456",
        isExpired: true,
        isIncoming: true,
      });

      render(<View {...buildViewModel({ proposal })} />);

      expect(screen.getByText("Expired")).toBeInTheDocument();
    });

    it("should display time remaining when not expired", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        isExpired: false,
      });

      render(<View {...buildViewModel({ proposal, timeRemaining: "2h 30m 15s" })} />);

      expect(screen.getByText("2h 30m 15s")).toBeInTheDocument();
    });

    it("should not display time remaining section when expired", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        isExpired: true,
      });

      render(<View {...buildViewModel({ proposal, timeRemaining: "" })} />);

      expect(screen.queryByText("Expires in")).not.toBeInTheDocument();
    });

    it("should display formatted expiry date", () => {
      render(<View {...buildViewModel({ dateFormatted: "2025-12-25" })} />);

      expect(screen.getByText("2025-12-25")).toBeInTheDocument();
    });
  });

  describe("action buttons for incoming transactions", () => {
    it("should show accept and reject buttons for incoming transaction", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        isIncoming: true,
      });

      render(<View {...buildViewModel({ proposal })} />);

      expect(screen.getByText("Accept")).toBeInTheDocument();
      expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    it("should disable accept button for expired incoming transaction", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-456",
        isIncoming: true,
        isExpired: true,
      });

      render(<View {...buildViewModel({ proposal })} />);

      const acceptButton = screen.getByText("Accept").closest("button");
      expect(acceptButton).toBeDisabled();
    });

    it("should call handleAction with accept when accept button is clicked", () => {
      const handleAction = jest.fn();
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        isIncoming: true,
      });

      render(<View {...buildViewModel({ proposal, handleAction })} />);

      const acceptButton = screen.getByText("Accept").closest("button");
      fireEvent.click(acceptButton!);

      expect(handleAction).toHaveBeenCalledWith("accept");
    });

    it("should call handleAction with reject when reject button is clicked", () => {
      const handleAction = jest.fn();
      const proposal = createProcessedProposal({
        contractId: "contract-123",
        isIncoming: true,
      });

      render(<View {...buildViewModel({ proposal, handleAction })} />);

      const rejectButton = screen.getByText("Reject").closest("button");
      fireEvent.click(rejectButton!);

      expect(handleAction).toHaveBeenCalledWith("reject");
    });

    it("should not call handleAction when clicking disabled accept button on expired proposal", () => {
      const handleAction = jest.fn();
      const proposal = createProcessedProposal({
        contractId: "contract-456",
        isIncoming: true,
        isExpired: true,
      });

      render(<View {...buildViewModel({ proposal, handleAction })} />);

      const acceptButton = screen.getByText("Accept").closest("button");
      fireEvent.click(acceptButton!);

      expect(handleAction).not.toHaveBeenCalledWith("accept");
    });
  });

  describe("action buttons for outgoing transactions", () => {
    it("should show withdraw button for outgoing transaction", () => {
      const proposal = createProcessedProposal({
        contractId: "contract-789",
        isIncoming: false,
      });

      render(<View {...buildViewModel({ proposal })} />);

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.queryByText("Accept")).not.toBeInTheDocument();
      expect(screen.queryByText("Reject")).not.toBeInTheDocument();
    });

    it("should call handleAction with withdraw when cancel button is clicked", () => {
      const handleAction = jest.fn();
      const proposal = createProcessedProposal({
        contractId: "contract-789",
        isIncoming: false,
      });

      render(<View {...buildViewModel({ proposal, handleAction })} />);

      const withdrawButton = screen.getByText("Cancel").closest("button");
      fireEvent.click(withdrawButton!);

      expect(handleAction).toHaveBeenCalledWith("withdraw");
    });
  });

  describe("when proposal does not exist", () => {
    it("should display not found message", () => {
      render(<View {...buildViewModel({ proposal: null })} />);

      expect(screen.getByText("common.notFound")).toBeInTheDocument();
    });
  });
});
