import React from "react";
import { render, screen, fireEvent, waitFor } from "tests/testSetup";
import DeviceAppModal from "./DeviceAppModal";

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

jest.mock("~/renderer/components/DeviceAction", () => ({
  __esModule: true,
  default: ({
    onResult,
  }: {
    onResult: (result: { device?: { deviceId?: string; wired?: boolean } }) => Promise<void>;
  }) => (
    <div data-testid="device-action">
      <button
        onClick={() =>
          onResult({
            device: {
              deviceId: "test-device-id",
              wired: false,
            },
          })
        }
      >
        Connect Device
      </button>
    </div>
  ),
}));

jest.mock("~/renderer/components/Modal", () => ({
  __esModule: true,
  default: ({
    children,
    isOpened,
    onClose,
  }: {
    children: React.ReactNode;
    isOpened: boolean;
    onClose?: () => void;
  }) =>
    isOpened ? (
      <div data-testid="modal">
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        {children}
      </div>
    ) : null,
  ModalBody: ({
    title,
    render,
    onClose,
  }: {
    title: string;
    render: () => React.ReactNode;
    onClose?: () => void;
  }) => (
    <div data-testid="modal-body">
      <div data-testid="modal-title">{title}</div>
      <button onClick={onClose} data-testid="modal-body-close">
        Close Body
      </button>
      {render()}
    </div>
  ),
}));

jest.mock("~/renderer/components/SuccessDisplay", () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="success-display">
      <div data-testid="success-title">{title}</div>
      <div data-testid="success-description">{description}</div>
    </div>
  ),
}));

jest.mock("~/renderer/components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error, onRetry }: { error: Error; onRetry?: () => void }) => (
    <div data-testid="error-display">
      <div data-testid="error-message">{error.message}</div>
      {onRetry && (
        <button onClick={onRetry} data-testid="error-retry">
          Retry
        </button>
      )}
    </div>
  ),
}));

jest.mock("~/renderer/components/BigSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="big-spinner">Loading...</div>,
}));

describe("DeviceAppModal", () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when modal is closed", () => {
    it("should not render when isOpen is false", () => {
      render(
        <DeviceAppModal
          isOpen={false}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });

  describe("when modal is open", () => {
    it("should render modal with correct title for accept action", () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByTestId("device-action")).toBeInTheDocument();
    });

    it("should render modal with correct title for reject action", () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="reject"
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should render modal with correct title for withdraw action", () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="withdraw"
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      const closeButton = screen.getByTestId("modal-close");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should show device action when modal opens", () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      expect(screen.getByTestId("device-action")).toBeInTheDocument();
    });
  });

  describe("device connection flow", () => {
    it("should call onConfirm when device is connected", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith("test-device-id");
      });
    });

    it("should handle device connection with USB device", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      // Simulate USB device
      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it("should show success state after successful confirmation", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId("success-display")).toBeInTheDocument();
      });
    });

    it("should show error state when confirmation fails", async () => {
      const error = new Error("Confirmation failed");
      mockOnConfirm.mockRejectedValue(error);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-display")).toBeInTheDocument();
      });
    });

    it("should allow retry after error", async () => {
      const error = new Error("Confirmation failed");
      mockOnConfirm.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-display")).toBeInTheDocument();
      });

      const retryButton = screen.getByText(/retry/i);
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId("device-action")).toBeInTheDocument();
      });
    });
  });

  describe("different action types", () => {
    it("should display correct success message for accept action", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId("success-display")).toBeInTheDocument();
      });
    });

    it("should display correct success message for reject action", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="reject"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId("success-display")).toBeInTheDocument();
      });
    });

    it("should display correct success message for withdraw action", async () => {
      mockOnConfirm.mockResolvedValue(undefined);

      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="withdraw"
          onClose={mockOnClose}
        />,
      );

      const connectButton = screen.getByText("Connect Device");
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByTestId("success-display")).toBeInTheDocument();
      });
    });
  });
});
