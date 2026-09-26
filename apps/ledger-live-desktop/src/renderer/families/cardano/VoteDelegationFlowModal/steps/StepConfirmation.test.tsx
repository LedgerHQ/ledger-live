import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";
import { Operation } from "@ledgerhq/types-live";
import { StepProps } from "../types";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => <div data-testid="sync-account" />,
}));

jest.mock("~/renderer/components/SuccessDisplay", () => ({
  __esModule: true,
  default: ({ title, description }: { title: React.ReactNode; description: React.ReactNode }) => (
    <div data-testid="success-display">
      {title} {description}
    </div>
  ),
}));

jest.mock("~/renderer/components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error }: { error: Error }) => <div data-testid="error-display">{error.message}</div>,
}));

jest.mock("~/renderer/components/BroadcastErrorDisclaimer", () => ({
  __esModule: true,
  default: ({ title }: { title: React.ReactNode }) => (
    <div data-testid="broadcast-error">{title}</div>
  ),
}));

describe("StepConfirmation", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockProps = { t: jest.fn() } as unknown as StepProps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("StepConfirmation component", () => {
    it("renders success state when optimisticOperation is present", () => {
      render(
        <StepConfirmation
          {...mockProps}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          optimisticOperation={{ accountId: "acc-id" } as unknown as Operation}
        />,
      );

      expect(screen.getByTestId("sync-account")).toBeInTheDocument();
      expect(screen.getByTestId("success-display")).toBeInTheDocument();
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });

    it("renders error state when error is present", () => {
      const error = new Error("test error");
      render(<StepConfirmation {...mockProps} error={error} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("test error")).toBeInTheDocument();
      expect(screen.queryByTestId("broadcast-error")).not.toBeInTheDocument();
    });

    it("renders broadcast error disclaimer when signed and error is present", () => {
      const error = new Error("test error");
      render(<StepConfirmation {...mockProps} error={error} signed={true} />);

      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByTestId("broadcast-error")).toBeInTheDocument();
    });

    it("returns null if neither optimisticOperation nor error are present", () => {
      const { container } = render(<StepConfirmation {...mockProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("StepConfirmationFooter", () => {
    it("renders close button and calls onClose when clicked", () => {
      const onClose = jest.fn();
      render(<StepConfirmationFooter {...mockProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId("modal-close-button"));
      expect(onClose).toHaveBeenCalled();
    });

    it("renders retry button when error is present", () => {
      const onRetry = jest.fn();
      render(<StepConfirmationFooter {...mockProps} error={new Error()} onRetry={onRetry} />);

      expect(screen.getByTestId("modal-close-button")).toBeInTheDocument();
    });
  });
});
