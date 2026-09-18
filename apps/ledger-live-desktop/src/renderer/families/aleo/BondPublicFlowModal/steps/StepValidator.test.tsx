import BigNumber from "bignumber.js";
import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoAccount, AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../__mocks__/transaction.mock";
import { makeBondStepProps } from "../../__mocks__/stepProps.mock";
import type { StepProps } from "../types";
import StepValidator, { StepValidatorFooter } from "./StepValidator";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/react"),
  useAleoValidators: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/bridge/impl", () => ({
  __esModule: true,
  getAccountBridge: () => require("../../__mocks__/bridge.mock").resolvedAccountBridge,
  getCurrencyBridge: () => require("../../__mocks__/bridge.mock").resolvedCurrencyBridge,
}));
jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: ({ error }: { error: Error }) => <div data-testid="error-banner">{error.name}</div>,
}));

const mockUseAleoValidators = jest.mocked(useAleoValidators);

const FIGMENT = {
  address: "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t",
  name: "Figment",
  stakeMicrocredits: 63_051_013_000_000,
  isOpen: true,
  isUnbonding: false,
  commissionPercent: 10,
  estimatedYearlyRewardsRate: 0.062,
} as AleoValidator;

const OTHER = {
  ...FIGMENT,
  address: "aleo1vfukg8ky2mhfprw63000000000000000000000000000000000000000q",
  name: "Other Validator",
} as AleoValidator;

const bondedTo = (validator: string): AleoAccount =>
  ({
    ...ALEO_MAIN_ACCOUNT,
    aleoResources: { ...ALEO_MAIN_ACCOUNT.aleoResources, bondedValidator: validator },
  }) as AleoAccount;

beforeEach(() => {
  mockDomMeasurements();
  mockUseAleoValidators.mockReturnValue({
    validators: [FIGMENT, OTHER],
    loading: false,
    error: null,
  });
});

function setup(Component: React.ComponentType<StepProps>, overrides: Partial<StepProps> = {}) {
  const props = makeBondStepProps({
    account: ALEO_MAIN_ACCOUNT,
    transaction: makeAleoTransaction({ mode: "bond_public", recipient: FIGMENT.address }),
    ...overrides,
  });
  const utils = render(<Component {...props} />, {
    initialState: { settings: AFTER_ONBOARDING_STATE },
  });

  return { ...utils, props };
}

// Selection hangs off the row. The name is the explorer link and deliberately selects
// nothing, so tests that mean to select must target the row.
const validatorRow = (name: string) =>
  screen.getByText(name).closest("[data-testid='modal-provider-row']") as HTMLElement;

describe("Aleo bond StepValidator", () => {
  it("lets the user pick a different validator", async () => {
    const { props } = setup(StepValidator);

    await userEvent.click(validatorRow("Other Validator"));

    expect(props.onUpdateTransaction).toHaveBeenCalledTimes(1);
  });

  it("leaves the selection alone when the validator name is clicked", async () => {
    const { props } = setup(StepValidator);

    await userEvent.click(screen.getByText("Other Validator"));

    expect(props.onUpdateTransaction).not.toHaveBeenCalled();
  });

  it("surfaces a step error", () => {
    setup(StepValidator, { error: new Error("boom") });

    expect(screen.getByTestId("error-banner")).toBeInTheDocument();
  });

  it("surfaces a recipient error from the status", () => {
    setup(StepValidator, {
      status: {
        errors: { recipient: new Error("InvalidAddress") },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      },
    });

    expect(screen.getByTestId("error-banner")).toBeInTheDocument();
  });

  it("shows no top-up notice when nothing is bonded yet", () => {
    setup(StepValidator);

    expect(screen.queryByText(/Aleo allows one validator per account/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("bonded-validator")).not.toBeInTheDocument();
  });

  it("explains the single-validator rule once a position is open", () => {
    setup(StepValidator, {
      account: bondedTo(OTHER.address),
      transaction: makeAleoTransaction({ mode: "bond_public", recipient: OTHER.address }),
    });

    expect(screen.getByText(/Aleo allows one validator per account/)).toBeInTheDocument();
    expect(screen.getByTestId("bonded-validator")).toHaveTextContent("Other Validator");
  });
});

describe("Aleo bond StepValidatorFooter", () => {
  it("moves on to the amount step", async () => {
    const { props } = setup(StepValidatorFooter);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(props.transitionTo).toHaveBeenCalledWith("amount");
  });

  it("closes the modal from Cancel", async () => {
    const { props } = setup(StepValidatorFooter);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks Continue until a validator is chosen", () => {
    setup(StepValidatorFooter, {
      transaction: makeAleoTransaction({ mode: "bond_public", recipient: "" }),
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("blocks Continue while the bridge is still preparing", () => {
    setup(StepValidatorFooter, { bridgePending: true });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("blocks Continue on a recipient error", () => {
    setup(StepValidatorFooter, {
      status: {
        errors: { recipient: new Error("InvalidAddress") },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
