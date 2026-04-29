import React from "react";
import { render, screen } from "tests/testSetup";
import StepAmount from "./StepAmount";
import { makeStepProps } from "../../../__mocks__/stepProps.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";

jest.mock("@ledgerhq/live-common/account/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/account/index"),
  getMainAccount: jest.fn((account: unknown) => account),
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/CurrencyDownStatusAlert", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/components/ErrorBanner", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/SpendableBanner", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/modals/Send/SendAmountFields", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/modals/Send/fields/AmountField", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/components/LowGasAlertBuyMore", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/actions/modals", () => ({ closeAllModal: jest.fn() }));

describe("StepAmount (Aleo)", () => {
  const defaultProps = makeStepProps({ transaction: makeAleoTransaction() });

  it("should render the aleo-step-amount container", () => {
    render(<StepAmount {...defaultProps} />);

    expect(screen.getByTestId("aleo-step-amount")).toBeInTheDocument();
  });

  it("should render nothing when status is not provided", () => {
    const { container } = render(
      <StepAmount {...defaultProps} status={undefined as unknown as typeof defaultProps.status} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
