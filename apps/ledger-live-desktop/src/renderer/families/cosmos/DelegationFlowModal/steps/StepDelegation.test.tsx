import React from "react";
import { render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CosmosAccount, Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import StepDelegation, { StepDelegationFooter } from "./StepDelegation";
import type { StepProps } from "../types";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    createTransaction: () => ({}),
    updateTransaction: (tx: object, patch: object) => ({ ...tx, ...patch }),
  }),
}));
jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));
jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="account-footer" />,
}));

let chosenVoteAccAddrSeen: string | null = null;
let validatorFieldOnChange: ((a: { address: string }) => void) | null = null;
jest.mock("../fields/ValidatorField", () => ({
  __esModule: true,
  default: ({
    chosenVoteAccAddr,
    onChangeValidator,
  }: {
    chosenVoteAccAddr: string;
    onChangeValidator: (a: { address: string }) => void;
  }) => {
    chosenVoteAccAddrSeen = chosenVoteAccAddr;
    validatorFieldOnChange = onChangeValidator;
    return <div data-testid="validator-field" />;
  },
}));

const buildAccount = (): CosmosAccount =>
  ({
    type: "Account",
    freshAddress: "cosmos1test",
    currency: getCryptoCurrencyById("cosmos"),
    stakingResources: { delegations: [] },
  }) as unknown as CosmosAccount;

const buildProps = (transaction: Partial<Transaction>): StepProps =>
  ({
    account: buildAccount(),
    parentAccount: undefined,
    transaction: { family: "cosmos", mode: "delegate", ...transaction } as Transaction,
    status: { errors: {} },
    onUpdateTransaction: jest.fn(),
    error: null,
    t: (k: string) => k,
  }) as unknown as StepProps;

describe("Cosmos Delegation StepDelegation", () => {
  beforeEach(() => {
    chosenVoteAccAddrSeen = null;
    validatorFieldOnChange = null;
  });

  it("passes the transaction's valAddress down as the chosen validator", () => {
    render(<StepDelegation {...buildProps({ valAddress: "validatorA" })} />);
    expect(chosenVoteAccAddrSeen).toBe("validatorA");
  });

  it("defaults the chosen validator to an empty string when valAddress is unset", () => {
    render(<StepDelegation {...buildProps({})} />);
    expect(chosenVoteAccAddrSeen).toBe("");
  });

  it("updates the transaction's mode and valAddress when a validator is chosen", () => {
    const props = buildProps({});
    render(<StepDelegation {...props} />);
    validatorFieldOnChange?.({ address: "validatorB" });
    const updater = (props.onUpdateTransaction as jest.Mock).mock.calls[0][0];
    const result = updater(props.transaction as Transaction);
    expect(result.mode).toBe("delegate");
    expect(result.valAddress).toBe("validatorB");
  });
});

describe("Cosmos Delegation StepDelegationFooter", () => {
  const buildFooterProps = (overrides: Partial<StepProps>): StepProps =>
    ({
      account: buildAccount(),
      parentAccount: undefined,
      transitionTo: jest.fn(),
      onClose: jest.fn(),
      status: { errors: {} },
      bridgePending: false,
      transaction: { family: "cosmos", mode: "delegate" } as Transaction,
      ...overrides,
    }) as unknown as StepProps;

  it("enables continue once a validator has been chosen", () => {
    render(
      <StepDelegationFooter
        {...buildFooterProps({
          transaction: {
            family: "cosmos",
            mode: "delegate",
            valAddress: "validatorA",
          } as Transaction,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("disables continue when no validator is chosen yet", () => {
    render(
      <StepDelegationFooter
        {...buildFooterProps({
          transaction: { family: "cosmos", mode: "delegate" } as Transaction,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("disables continue while the bridge is pending even if a validator is chosen", () => {
    render(
      <StepDelegationFooter
        {...buildFooterProps({
          bridgePending: true,
          transaction: {
            family: "cosmos",
            mode: "delegate",
            valAddress: "validatorA",
          } as Transaction,
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
