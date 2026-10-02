import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import StepDRep, { StepDRepFooter } from "./StepDRepSelection";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import { StepProps } from "../types";

jest.mock("~/renderer/modals/Send/AccountFooter", () => {
  return function MockAccountFooter() {
    return <div data-testid="account-footer" />;
  };
});

jest.mock("../DRep", () => {
  return function MockDRepField({ onChangeDRep }: { onChangeDRep: (d: { hex: string }) => void }) {
    return (
      <div data-testid="dRep-field">
        <button onClick={() => onChangeDRep({ hex: "drep1" })}>Select DRep</button>
      </div>
    );
  };
});

jest.mock("~/renderer/components/ErrorBanner", () => {
  return function MockErrorBanner({ error }: { error: Error }) {
    return <div data-testid="error-banner">{error.message}</div>;
  };
});

jest.mock("~/renderer/components/Alert", () => {
  return function MockAlert({ children }: { children: React.ReactNode }) {
    return <div data-testid="alert-error">{children}</div>;
  };
});

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn().mockReturnValue({
    updateTransaction: jest.fn((tx, update) => ({ ...tx, ...update })),
  }),
}));

describe("StepDRepSelection", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockAccount = {
    type: "Account",
    id: "account-id",
    cardanoResources: {},
    currency: { color: "#ffffff", units: [{ code: "ADA" }] },
  } as CardanoAccount;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockTransaction = { id: "tx-id" } as unknown as Transaction;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockProps = {
    account: mockAccount,
    onUpdateTransaction: jest.fn(cb => cb(mockTransaction)),
    status: { errors: {} },
    error: undefined,
    t: jest.fn(),
    setSelectedDRep: jest.fn(),
  } as unknown as StepProps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("StepDRep", () => {
    it("renders DRepField and handles selection", () => {
      render(<StepDRep {...mockProps} />);

      expect(screen.getByTestId("dRep-field")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Select DRep"));

      expect(mockProps.setSelectedDRep).toHaveBeenCalledWith({ hex: "drep1" });
      expect(mockProps.onUpdateTransaction).toHaveBeenCalled();
    });

    it("renders the error banner if the error prop is present", () => {
      render(<StepDRep {...mockProps} error={new Error("test error")} />);

      expect(screen.getByTestId("error-banner")).toHaveTextContent("test error");
    });

    it("renders the alert banner if there is an amount error in the transaction status", () => {
      render(
        <StepDRep
          {...mockProps}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          status={{ errors: { amount: new Error("amount error") } } as unknown as TransactionStatus}
        />,
      );

      expect(screen.getByTestId("alert-error")).toBeInTheDocument();
    });
  });

  describe("StepDRepFooter", () => {
    const footerProps = {
      ...mockProps,
      transitionTo: jest.fn(),
      bridgePending: false,
      transaction: mockTransaction,
      onClose: jest.fn(),
    };

    it("renders the continue button as enabled when canNext is true", () => {
      render(<StepDRepFooter {...footerProps} />);

      const continueBtn = screen.getByText(/Continue/i).closest("button");
      expect(continueBtn).not.toBeDisabled();

      fireEvent.click(continueBtn!);
      expect(footerProps.transitionTo).toHaveBeenCalledWith("summary");
    });

    it("renders the continue button as disabled when errors are present", () => {
      render(
        <StepDRepFooter
          {...footerProps}
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          status={{ errors: { someError: new Error() } } as unknown as TransactionStatus}
        />,
      );

      const continueBtn = screen.getByText(/Continue/i).closest("button");
      expect(continueBtn).toBeDisabled();
    });

    it("renders the continue button as disabled when the bridge is pending", () => {
      render(<StepDRepFooter {...footerProps} bridgePending={true} />);

      const continueBtn = screen.getByText(/Continue/i).closest("button");
      expect(continueBtn).toBeDisabled();
    });

    it("calls onClose when the cancel button is clicked", () => {
      render(<StepDRepFooter {...footerProps} />);

      fireEvent.click(screen.getByText(/Cancel/i));
      expect(footerProps.onClose).toHaveBeenCalled();
    });
  });
});
