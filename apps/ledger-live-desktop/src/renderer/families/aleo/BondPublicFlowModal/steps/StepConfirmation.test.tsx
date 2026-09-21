import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import i18n from "~/renderer/i18n/init";
import { track } from "~/renderer/analytics/segment";
import { setDrawer } from "~/renderer/drawers/Provider";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { makeBondStepProps } from "../../__mocks__/stepProps.mock";
import { makeAleoTransaction } from "../../__mocks__/transaction.mock";
import { mockBroadcastedOperation } from "../../__mocks__/signedOperation.mock";
import { ALEO_MAIN_ACCOUNT } from "../../__mocks__/account.mock";
import type { StepProps } from "../types";
import StepConfirmation, { StepConfirmationFooter } from "./StepConfirmation";

jest.mock("~/renderer/analytics/segment", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));
jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/drawers/Provider"),
  setDrawer: jest.fn(),
}));

const mockTrack = jest.mocked(track);
const mockSetDrawer = jest.mocked(setDrawer);

const VALIDATOR = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const bondProps = (overrides: Partial<StepProps> = {}) =>
  makeBondStepProps({
    t: i18n.t.bind(i18n),
    transaction: makeAleoTransaction({ mode: "bond_public", recipient: VALIDATOR }),
    ...overrides,
  });

function setup(Component: React.ComponentType<StepProps>, overrides: Partial<StepProps> = {}) {
  const props = bondProps(overrides);
  const utils = render(<Component {...props} />, {
    initialState: { settings: AFTER_ONBOARDING_STATE },
  });

  return { ...utils, props };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Aleo bond StepConfirmation", () => {
  it("shows the success state once the operation is broadcast", () => {
    setup(StepConfirmation, { optimisticOperation: mockBroadcastedOperation });

    expect(screen.getByText("Bond sent")).toBeInTheDocument();
    expect(screen.getByText("Your bond is being processed.")).toBeInTheDocument();
  });

  it("tracks staking_completed with the validator that was bonded to", () => {
    setup(StepConfirmation, { optimisticOperation: mockBroadcastedOperation });

    expect(mockTrack).toHaveBeenCalledWith("staking_completed", {
      currency: "ALEO",
      validator: VALIDATOR,
      source: undefined,
      delegation: "bonding",
      flow: "bond",
    });
  });

  // Without an operation there is nothing completed to report.
  it("does not track anything while the step is still pending", () => {
    setup(StepConfirmation);

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("renders nothing while neither an operation nor an error has arrived", () => {
    const { container } = setup(StepConfirmation);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the error on its own when signing failed", () => {
    setup(StepConfirmation, { error: new Error("nope"), signed: false });

    expect(screen.queryByText("Your bond could not be sent.")).not.toBeInTheDocument();
  });

  // A signed-but-failed transaction may still land, so the user is warned rather than
  // told it simply failed.
  it("adds the broadcast disclaimer when the transaction was already signed", () => {
    setup(StepConfirmation, { error: new Error("nope"), signed: true });

    expect(screen.getByText("Your bond could not be sent.")).toBeInTheDocument();
  });
});

describe("Aleo bond StepConfirmationFooter", () => {
  it("closes the modal from the close button", async () => {
    const { props } = setup(StepConfirmationFooter);

    await userEvent.click(screen.getByTestId("modal-close-button"));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("offers a retry instead of details when the step errored", async () => {
    const { props } = setup(StepConfirmationFooter, { error: new Error("nope") });

    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("closes the modal and opens the operation drawer from View details", async () => {
    const { props } = setup(StepConfirmationFooter, {
      account: ALEO_MAIN_ACCOUNT,
      optimisticOperation: mockBroadcastedOperation,
    });

    await userEvent.click(screen.getByText("View details"));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockSetDrawer).toHaveBeenCalledWith(expect.anything(), {
      operationId: mockBroadcastedOperation.id,
      accountId: ALEO_MAIN_ACCOUNT.id,
    });
  });

  it("prefers the first sub-operation when the bond produced one", async () => {
    setup(StepConfirmationFooter, {
      account: ALEO_MAIN_ACCOUNT,
      optimisticOperation: {
        ...mockBroadcastedOperation,
        subOperations: [{ ...mockBroadcastedOperation, id: "sub-op-1" }],
      },
    });

    await userEvent.click(screen.getByText("View details"));

    expect(mockSetDrawer).toHaveBeenCalledWith(expect.anything(), {
      operationId: "sub-op-1",
      accountId: ALEO_MAIN_ACCOUNT.id,
    });
  });

  it("shows neither retry nor details while the step is still pending", () => {
    setup(StepConfirmationFooter);

    expect(screen.queryByText("View details")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
