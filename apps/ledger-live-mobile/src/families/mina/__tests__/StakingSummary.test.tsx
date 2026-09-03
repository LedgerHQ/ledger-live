import React from "react";
import { render, screen } from "@tests/test-renderer";
import StakingSummary from "../StakingFlow/02-Summary";
import { createMockMinaAccount, createMockTransaction, mockValidators } from "./testUtils";
import { ScreenName } from "~/const";

const navigate = jest.fn();
const createTransaction = jest.fn(() => ({ family: "mina" }));
const updateTransaction = jest.fn((tx: object, patch: object) => ({ ...tx, ...patch }));
// Mirrors the hook reducer: it hands the current transaction to the updater.
const applyTransactionUpdate = jest.fn((updater: (tx: unknown) => unknown) =>
  updater(bridgeTransactionState.transaction),
);

let bridgeTransactionState: {
  transaction: unknown;
  updateTransaction: typeof applyTransactionUpdate;
  status: { errors: Record<string, Error>; warnings: Record<string, Error> };
  bridgePending: boolean;
  bridgeError: Error | null;
};

// The screen is rendered on its own rather than through the staking navigator, so `useIsFocused`
// has no screen to report on. The rest of the module, the theme in particular, stays real.
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
}));

// The real bridge resolves the mina family and talks to the network, and the real hook drives
// the whole screen off it.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ createTransaction, updateTransaction }),
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: () => bridgeTransactionState,
}));

const account = createMockMinaAccount();
const validator = mockValidators[0];
const transaction = createMockTransaction({ recipient: validator.address });

function renderSummary(params: Record<string, unknown> = {}) {
  const route = {
    key: "summary",
    name: ScreenName.MinaStakingSummary,
    params: { accountId: account.id, validator, ...params },
  };
  return render(
    // The screen only reads `navigate` off the navigation prop.
    <StakingSummary navigation={{ navigate } as never} route={route as never} />,
    {
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [account] },
      }),
    },
  );
}

describe("StakingFlow/02-Summary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bridgeTransactionState = {
      transaction,
      updateTransaction: applyTransactionUpdate,
      status: { errors: {}, warnings: {} },
      bridgePending: false,
      bridgeError: null,
    };
  });

  it("summarises the delegated amount and the chosen validator", () => {
    renderSummary();

    expect(screen.getByText("I delegate")).toBeOnTheScreen();
    expect(screen.getByText("to")).toBeOnTheScreen();
    expect(screen.getByTestId("mina-delegation-summary-validator")).toHaveTextContent(
      validator.name,
    );
  });

  it("falls back to the validator address when it has no name", () => {
    renderSummary({ validator: { ...validator, name: undefined } });

    expect(screen.getByTestId("mina-delegation-summary-validator")).toHaveTextContent(
      validator.address,
    );
  });

  it("realigns the transaction recipient on the selected validator", () => {
    renderSummary();

    expect(applyTransactionUpdate).toHaveBeenCalled();
    expect(updateTransaction).toHaveBeenCalledWith(transaction, { recipient: validator.address });
  });

  it("continues to the device step with the prepared transaction", async () => {
    const { user } = renderSummary();

    await user.press(screen.getByTestId("enabled-mina-summary-continue-button"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.MinaStakingSelectDevice, {
      accountId: account.id,
      parentId: undefined,
      validator,
      transaction,
      status: { errors: {}, warnings: {} },
    });
  });

  it("goes back to the validator step when the delegator is changed", async () => {
    const { user } = renderSummary();

    await user.press(screen.getByTestId("mina-delegation-summary-validator"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.MinaStakingValidator, {
      accountId: account.id,
    });
  });

  it("surfaces the status error and blocks the continue button", () => {
    bridgeTransactionState.status = {
      errors: { amount: new Error("NotEnoughBalance") },
      warnings: {},
    };
    renderSummary();

    expect(screen.getByText("NotEnoughBalance")).toBeOnTheScreen();
    expect(screen.getByTestId("disabled-mina-summary-continue-button")).toBeDisabled();
  });

  it("blocks the continue button while the bridge is pending", () => {
    bridgeTransactionState.bridgePending = true;
    renderSummary();

    expect(screen.getByTestId("disabled-mina-summary-continue-button")).toBeDisabled();
  });

  it("blocks the continue button when the bridge errored", () => {
    bridgeTransactionState.bridgeError = new Error("bridge down");
    renderSummary();

    expect(screen.getByTestId("disabled-mina-summary-continue-button")).toBeDisabled();
  });
});
