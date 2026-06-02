import React from "react";
import { render, screen } from "tests/testSetup";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { getAleoCurrencyConfig } from "../../../shared/utils";
import StepAmount from "./StepAmount";
import { makeStepProps } from "../../../__mocks__/stepProps.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import { mockAleoCoinConfig } from "../../../__mocks__/config.mock";

jest.mock("../../../shared/utils", () => ({
  ...jest.requireActual("../../../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/CurrencyDownStatusAlert", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/components/ErrorBanner", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/components/SpendableBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="spendable-banner" />,
}));
jest.mock("~/renderer/modals/Send/SendAmountFields", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/modals/Send/fields/AmountField", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("~/renderer/actions/modals", () => ({ closeAllModal: jest.fn() }));
jest.mock("../../../shared/InfoBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="info-banner" />,
}));
jest.mock("../../../shared/QuickAmountSelector", () => ({
  __esModule: true,
  default: () => <div data-testid="quick-amount-selector" />,
}));

const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

describe("StepAmount (Aleo)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      recordPickingStrategy: "manual",
    });
  });

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

  it("should render SpendableBanner when recordPickingStrategy is manual", () => {
    render(<StepAmount {...defaultProps} />);

    expect(screen.getByTestId("spendable-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("info-banner")).not.toBeInTheDocument();
  });

  it("should render InfoBanner when recordPickingStrategy is auto", () => {
    mockGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      recordPickingStrategy: "auto",
    });

    const props = makeStepProps({
      transaction: makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE }),
    });

    render(<StepAmount {...props} />);

    expect(screen.getByTestId("info-banner")).toBeInTheDocument();
    expect(screen.queryByTestId("spendable-banner")).not.toBeInTheDocument();
  });

  it("should render QuickAmountSelector for an AleoAccount with auto strategy", () => {
    mockGetAleoCurrencyConfig.mockReturnValue({
      ...mockAleoCoinConfig,
      recordPickingStrategy: "auto",
    });

    const props = makeStepProps({
      transaction: makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE }),
    });

    render(<StepAmount {...props} />);

    expect(screen.getByTestId("quick-amount-selector")).toBeInTheDocument();
  });

  it("should NOT render QuickAmountSelector when strategy is manual", () => {
    render(<StepAmount {...defaultProps} />);

    expect(screen.queryByTestId("quick-amount-selector")).not.toBeInTheDocument();
  });
});
