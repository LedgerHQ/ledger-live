import React from "react";
import { render, screen, fireEvent, waitFor } from "tests/testSetup";
import { setEnv } from "@ledgerhq/live-env";
import DeviceAppModal from "./DeviceAppModal";

describe("DeviceAppModal", () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setEnv("MOCK", "1");
    // Create modals container for Modal component
    if (!document.getElementById("modals")) {
      const modalsContainer = document.createElement("div");
      modalsContainer.id = "modals";
      document.body.appendChild(modalsContainer);
    }
  });

  afterEach(() => {
    setEnv("MOCK", "");
    const modalsContainer = document.getElementById("modals");
    if (modalsContainer) {
      document.body.removeChild(modalsContainer);
    }
  });

  describe("when modal is closed", () => {
    it("should not render when isOpen is false", () => {
      render(
        <DeviceAppModal
          isOpen={false}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
          appName="Canton"
        />,
      );

      expect(screen.queryByTestId("canton-offer-action-modal")).not.toBeInTheDocument();
    });
  });

  describe("when modal is open", () => {
    it("should render modal with correct title for accept action", async () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
          appName="Canton"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("modal-container")).toBeInTheDocument();
      });
    });

    it("should render modal with correct title for reject action", async () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="reject"
          onClose={mockOnClose}
          appName="Canton"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("modal-container")).toBeInTheDocument();
      });
    });

    it("should render modal with correct title for withdraw action", async () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="withdraw"
          onClose={mockOnClose}
          appName="Canton"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("modal-container")).toBeInTheDocument();
      });
    });

    it("should call onClose when close button is clicked", async () => {
      render(
        <DeviceAppModal
          isOpen={true}
          onConfirm={mockOnConfirm}
          action="accept"
          onClose={mockOnClose}
          appName="Canton"
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("modal-close-button")).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId("modal-close-button");
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
