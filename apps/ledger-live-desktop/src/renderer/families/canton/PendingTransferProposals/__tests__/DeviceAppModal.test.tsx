import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { View } from "../DeviceAppModal";
import type { DeviceAppModalViewModel } from "../useDeviceAppModalViewModel";

const buildViewModel = (overrides?: Partial<DeviceAppModalViewModel>): DeviceAppModalViewModel => ({
  isOpen: true,
  action: "accept",
  onClose: jest.fn(),
  confirmationState: "confirming",
  error: null,
  request: { appName: "Canton" },
  actionConnect: {} as DeviceAppModalViewModel["actionConnect"],
  handleDeviceResult: jest.fn(),
  handleRetry: jest.fn(),
  ...overrides,
});

describe("DeviceAppModal View", () => {
  beforeEach(() => {
    if (!document.getElementById("modals")) {
      const modalsContainer = document.createElement("div");
      modalsContainer.id = "modals";
      document.body.appendChild(modalsContainer);
    }
  });

  afterEach(() => {
    const modalsContainer = document.getElementById("modals");
    if (modalsContainer) {
      document.body.removeChild(modalsContainer);
    }
  });

  describe("when modal is closed", () => {
    it("should not render when isOpen is false", () => {
      render(<View {...buildViewModel({ isOpen: false })} />);

      expect(screen.queryByTestId("canton-offer-action-modal")).not.toBeInTheDocument();
    });
  });

  describe("when modal is open", () => {
    it("should render modal container", () => {
      render(<View {...buildViewModel()} />);

      expect(screen.getByTestId("modal-container")).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      const onClose = jest.fn();
      render(<View {...buildViewModel({ onClose })} />);

      fireEvent.click(screen.getByTestId("modal-close-button"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("confirmation states", () => {
    it("should render success title and description when completed", () => {
      render(<View {...buildViewModel({ confirmationState: "completed", action: "accept" })} />);

      expect(screen.getByTestId("success-message-label")).toHaveTextContent("Offer Accepted");
      expect(
        screen.getByText("The transfer offer has been successfully accepted."),
      ).toBeInTheDocument();
    });

    it("should render error message and retry option when in error state", () => {
      const error = new Error("Test failure");
      const handleRetry = jest.fn();
      render(<View {...buildViewModel({ confirmationState: "error", error, handleRetry })} />);

      expect(screen.getByText(/test failure/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should render processing text when confirming", () => {
      render(<View {...buildViewModel({ confirmationState: "confirming" })} />);

      expect(screen.getByText(/processing accept/i)).toBeInTheDocument();
    });
  });

  describe("action titles", () => {
    it.each(["accept", "reject", "withdraw"] as const)(
      "should render modal for %s action",
      action => {
        render(<View {...buildViewModel({ action })} />);

        expect(screen.getByTestId("modal-container")).toBeInTheDocument();
      },
    );
  });
});
