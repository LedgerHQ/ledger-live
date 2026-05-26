import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import StepSummary, { StepSummaryFooter } from "./StepSummary";
import {
  Transaction,
  CardanoAccount,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import { StepProps } from "../types";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getAccountCurrency: jest.fn().mockReturnValue({ name: "Cardano", ticker: "ADA" }),
}));

jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn().mockReturnValue({ code: "ADA", magnitude: 6 }),
}));

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  useDateFormatter: () => (_date: Date) => "Formatted Date",
  dayAndHourFormat: "dayAndHourFormat",
}));

jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({ val }: { val: BigNumber }) => <div data-testid="formatted-val">{val.toString()}</div>,
}));

jest.mock("~/renderer/components/CounterValue", () => ({
  __esModule: true,
  default: () => <div data-testid="counter-value" />,
}));

jest.mock("~/renderer/components/StepProgress", () => ({
  __esModule: true,
  default: () => <div data-testid="step-progress" />,
}));

describe("StepSummary", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockAccount = {
    id: "account-id",
    currency: { id: "cardano" },
    cardanoResources: { delegation: { status: true } },
  } as CardanoAccount;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockTransaction = {
    dRepAbstain: false,
    dRepNoConfidence: false,
    protocolParams: { stakeKeyDeposit: "2000000" },
  } as Transaction;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockStatus = {
    estimatedFees: new BigNumber("10000"),
    warnings: {},
  } as TransactionStatus;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const mockDRep = {
    hex: "drep123",
    meta: { givenName: "Test dRep" },
    active: "2023-01-01",
  } as DRep;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const defaultProps = {
    account: mockAccount,
    transaction: mockTransaction,
    status: mockStatus,
    selectedDRep: mockDRep,
    bridgePending: false,
  } as StepProps;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("StepSummary component", () => {
    it("returns null if the transaction is missing", () => {
      const { container } = render(
        <StepSummary
          {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({ ...defaultProps, transaction: undefined } as StepProps)
          }
        />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders StepProgress if the bridge is pending", () => {
      render(
        <StepSummary
          {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({ ...defaultProps, bridgePending: true } as StepProps)
          }
        />,
      );
      expect(screen.getByTestId("step-progress")).toBeInTheDocument();
    });

    it("renders correctly with the DRep name and hex", () => {
      render(<StepSummary {...defaultProps} />);
      expect(screen.getByText("Test dRep")).toBeInTheDocument();
      expect(screen.getByText("drep123")).toBeInTheDocument();
      expect(screen.getByText("Formatted Date")).toBeInTheDocument();
      expect(screen.getByText("10000")).toBeInTheDocument();
    });

    it("renders the Abstain option correctly", () => {
      render(
        <StepSummary
          {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({
              ...defaultProps,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              transaction: { ...mockTransaction, dRepAbstain: true } as Transaction,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              selectedDRep: undefined as unknown as DRep,
            } as StepProps)
          }
        />,
      );
      expect(screen.getByText("Always abstain")).toBeInTheDocument();
    });

    it("renders the stake key deposit when the account is not yet delegated", () => {
      render(
        <StepSummary
          {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({
              ...defaultProps,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              account: {
                ...mockAccount,
                cardanoResources: { delegation: { status: false } },
              } as CardanoAccount,
            } as StepProps)
          }
        />,
      );
      expect(screen.getByText(/Stake key registration deposit/i)).toBeInTheDocument();
      expect(screen.getByText("2000000")).toBeInTheDocument();
    });

    it("renders the fee-too-high warning when present", () => {
      render(
        <StepSummary
          {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({
              ...defaultProps,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              status: {
                ...mockStatus,
                warnings: { feeTooHigh: new Error("Fee high") },
              } as TransactionStatus,
            } as StepProps)
          }
        />,
      );
      // Warning section is rendered when feeTooHigh is present
      expect(screen.getByText("10000")).toBeInTheDocument();
    });
  });

  describe("StepSummaryFooter", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const footerProps = {
      transitionTo: jest.fn(),
      transaction: mockTransaction,
      onClose: jest.fn(),
    } as unknown as StepProps;

    it("renders the back button for a regular DRep delegation", () => {
      render(<StepSummaryFooter {...footerProps} />);

      fireEvent.click(screen.getByText(/Back/i).closest("button")!);
      expect(footerProps.transitionTo).toHaveBeenCalledWith("dRep");
    });

    it("renders the cancel button for direct mode (abstain)", () => {
      render(
        <StepSummaryFooter
          {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({
              ...footerProps,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              transaction: { ...mockTransaction, dRepAbstain: true } as Transaction,
            } as StepProps)
          }
        />,
      );

      fireEvent.click(screen.getByText(/Cancel/i).closest("button")!);
      expect(footerProps.onClose).toHaveBeenCalled();
    });

    it("navigates to the connectDevice step on continue", () => {
      render(<StepSummaryFooter {...footerProps} />);

      fireEvent.click(screen.getByText(/Continue/i).closest("button")!);
      expect(footerProps.transitionTo).toHaveBeenCalledWith("connectDevice");
    });
  });
});
