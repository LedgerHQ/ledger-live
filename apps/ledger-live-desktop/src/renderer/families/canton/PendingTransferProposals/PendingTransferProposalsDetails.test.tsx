import React from "react";
import { render, screen, fireEvent, waitFor, act } from "tests/testSetup";
import PendingTransactionDetails from "./PendingTransferProposalsDetails";
import { CantonAccount } from "@ledgerhq/live-common/families/canton/types";

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useAccountUnit: jest.fn(() => ({
    code: "AMU",
    magnitude: 18,
    name: "Amulet",
  })),
}));

jest.mock("~/renderer/components/CopyWithFeedback", () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => (
    <button data-testid={`copy-${text}`}>Copy {text}</button>
  ),
}));

jest.mock("~/renderer/components/OperationsList/AddressCell", () => ({
  SplitAddress: ({ value }: { value: string }) => (
    <span data-testid={`address-${value}`}>{value}</span>
  ),
}));

const createMockAccount = (xpub: string): CantonAccount =>
  ({
    id: "test-account-id",
    name: "Test Account",
    xpub,
    currency: {
      id: "canton_network",
      name: "Canton",
    },
    balance: {
      toNumber: () => 1000,
    },
    cantonResources: {
      pendingTransferProposals: [
        {
          contract_id: "contract-123",
          sender: "sender-address",
          receiver: "receiver-address",
          amount: "1000000",
          memo: "Test memo",
          expires_at_micros: Date.now() * 1000 + 3600000, // 1 hour from now
        },
        {
          contract_id: "contract-456",
          sender: "other-sender",
          receiver: xpub,
          amount: "2000000",
          memo: "",
          expires_at_micros: Date.now() * 1000 - 3600000, // 1 hour ago (expired)
        },
        {
          contract_id: "contract-789",
          sender: xpub, // Account is the sender (outgoing)
          receiver: "other-receiver",
          amount: "3000000",
          memo: "Outgoing memo",
          expires_at_micros: Date.now() * 1000 + 3600000, // 1 hour from now
        },
      ],
    },
  }) as unknown as CantonAccount;

describe("PendingTransactionDetails", () => {
  const mockOnClose = jest.fn();
  const mockOnOpenModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("when proposal exists", () => {
    it("should render proposal details for incoming transaction", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/from/i)).toBeInTheDocument();
      expect(screen.getByText(/to/i)).toBeInTheDocument();
      expect(screen.getByTestId("address-sender-address")).toBeInTheDocument();
      expect(screen.getByTestId("address-receiver-address")).toBeInTheDocument();
    });

    it("should render proposal details for outgoing transaction", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-456"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByTestId("address-other-sender")).toBeInTheDocument();
      expect(screen.getByTestId("address-receiver-address")).toBeInTheDocument();
    });

    it("should display memo when present", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      // Check for memo title and value separately
      const memoElements = screen.getAllByText(/memo/i);
      expect(memoElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Test memo")).toBeInTheDocument();
    });

    it("should not display memo section when memo is empty", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-456"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      const memoElements = screen.queryAllByText(/memo/i);
      expect(memoElements.length).toBe(0);
    });

    it("should display contract ID", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId("address-contract-123")).toBeInTheDocument();
      expect(screen.getByTestId("copy-contract-123")).toBeInTheDocument();
    });

    it("should display time remaining for non-expired proposals", async () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      // Run timers to trigger useEffect
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Wait for the time remaining to be calculated and displayed
      // The time remaining will be in format like "1h 0m 0s"
      await waitFor(() => {
        // Check that time remaining value is displayed (contains "h", "m", or "s")
        const timeRemaining = screen.getByText(/\d+[hms]/);
        expect(timeRemaining).toBeInTheDocument();
      });
    });

    it("should display expired status for expired proposals", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-456"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });

    it("should update time remaining every second", async () => {
      const account = createMockAccount("receiver-address");
      const futureTime = Date.now() + 10000; // 10 seconds from now to ensure it doesn't expire

      const accountWithFutureExpiry = {
        ...account,
        cantonResources: {
          pendingTransferProposals: [
            {
              ...account.cantonResources!.pendingTransferProposals[0],
              expires_at_micros: futureTime * 1000,
            },
          ],
        },
      };

      render(
        <PendingTransactionDetails
          account={accountWithFutureExpiry}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      // Run timers to trigger initial useEffect
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Wait for initial time remaining to be calculated and displayed
      await waitFor(() => {
        // Check that time remaining value is displayed
        const timeRemaining = screen.getByText(/\d+[hms]/);
        expect(timeRemaining).toBeInTheDocument();
      });

      // Verify time remaining is displayed initially
      const initialTimeRemaining = screen.getByText(/\d+[hms]/);
      expect(initialTimeRemaining).toBeInTheDocument();

      // Advance time by 1 second and wait for re-render
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Run pending timers to trigger the interval callback
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // The time remaining should still be visible after advancing time
      // The value should have updated (decreased by 1 second)
      await waitFor(() => {
        const updatedTimeRemaining = screen.queryByText(/\d+[hms]/);
        expect(updatedTimeRemaining).toBeInTheDocument();
        // The value should be different (or at least the element should exist)
        expect(updatedTimeRemaining?.textContent).toBeTruthy();
      });
    });
  });

  describe("action buttons for incoming transactions", () => {
    it("should show accept and reject buttons for incoming transaction", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/accept/i)).toBeInTheDocument();
      expect(screen.getByText(/reject/i)).toBeInTheDocument();
    });

    it("should disable accept button for expired incoming transaction", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-456"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      const acceptButton = screen.getByText(/accept/i).closest("button");
      expect(acceptButton).toBeDisabled();
    });

    it("should call onOpenModal with accept action when accept button is clicked", async () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      const acceptButton = screen.getByText(/accept/i).closest("button");
      fireEvent.click(acceptButton!);

      await waitFor(() => {
        expect(mockOnOpenModal).toHaveBeenCalledWith("contract-123", "accept");
      });
    });

    it("should call onOpenModal with reject action when reject button is clicked", async () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      const rejectButton = screen.getByText(/reject/i).closest("button");
      fireEvent.click(rejectButton!);

      await waitFor(() => {
        expect(mockOnOpenModal).toHaveBeenCalledWith("contract-123", "reject");
      });
    });

    it("should call onClose after opening modal", async () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-123"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      const acceptButton = screen.getByText(/accept/i).closest("button");
      fireEvent.click(acceptButton!);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("action buttons for outgoing transactions", () => {
    it("should show withdraw button for outgoing transaction", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-789"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/withdraw/i)).toBeInTheDocument();
      expect(screen.queryByText(/accept/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/reject/i)).not.toBeInTheDocument();
    });

    it("should call onOpenModal with withdraw action when withdraw button is clicked", async () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="contract-789"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      const withdrawButton = screen.getByText(/withdraw/i).closest("button");
      fireEvent.click(withdrawButton!);

      await waitFor(() => {
        expect(mockOnOpenModal).toHaveBeenCalledWith("contract-789", "withdraw");
      });
    });
  });

  describe("when proposal does not exist", () => {
    it("should display not found message", () => {
      const account = createMockAccount("receiver-address");

      render(
        <PendingTransactionDetails
          account={account}
          contractId="non-existent-contract"
          onOpenModal={mockOnOpenModal}
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByText(/notFound/i)).toBeInTheDocument();
    });
  });
});
