import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import type { StepProps } from "../types";

const updateTransactionMock = jest.fn((tx, patch) => ({ ...tx, ...patch }));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => ({
    createTransaction: jest.fn(),
    updateTransaction: updateTransactionMock,
    getTransactionStatus: jest.fn(),
  }),
}));

jest.mock("~/renderer/analytics/TrackPage", () => ({ __esModule: true, default: () => null }));

import StepValidator, { StepValidatorFooter } from "../steps/StepValidator";

const currency = getCryptoCurrencyById("stacks");

const makeAccount = (): StacksAccount =>
  ({
    ...genAccount("stacks-stepvalidator-test", { currency }),
  }) as unknown as StacksAccount;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "stacks",
    mode: "delegate",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...overrides,
  }) as unknown as Transaction;

const makeProps = (overrides: Partial<StepProps> = {}): StepProps => {
  const account = makeAccount();
  return {
    t: (key: string) => key,
    transitionTo: jest.fn(),
    device: null,
    account,
    transaction: makeTransaction(),
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    },
    bridgePending: false,
    error: null,
    optimisticOperation: null,
    signed: false,
    onClose: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    ...overrides,
  } as unknown as StepProps;
};

describe("StakeFlowModal/StepValidator", () => {
  beforeEach(() => {
    updateTransactionMock.mockClear();
  });

  it("updating the pool address field calls bridge.updateTransaction with {mode: 'delegate', valAddress}", () => {
    // `mode` travels together with `valAddress` -- setting it any earlier (before a pool address
    // exists) is what breaks the generic-bridge migration's intent validation (Body.tsx's
    // initial-transaction comment).
    const props = makeProps();
    act(() => {
      render(<StepValidator {...props} />);
    });

    act(() => {
      fireEvent.change(screen.getByTestId("stacks-stake-pool-address-input"), {
        target: { value: "SP1pool.native-pool-signer-manager" },
      });
    });

    expect(updateTransactionMock).toHaveBeenCalledWith(props.transaction, {
      mode: "delegate",
      valAddress: "SP1pool.native-pool-signer-manager",
    });
    expect(props.onChangeTransaction).toHaveBeenCalledTimes(1);
  });

  it("updating the numCycles field calls bridge.updateTransaction with {familySpecificData: {numCycles}}", () => {
    const props = makeProps();
    act(() => {
      render(<StepValidator {...props} />);
    });

    act(() => {
      fireEvent.change(screen.getByTestId("stacks-stake-num-cycles-input"), {
        target: { value: "6" },
      });
    });

    expect(updateTransactionMock).toHaveBeenCalledWith(props.transaction, {
      familySpecificData: { numCycles: 6 },
    });
  });
});

// Real, checksum-valid mainnet address (reused, unmocked, from coin-stacks's own
// buildUnsignedTx.test.ts fixtures) -- a placeholder like "SP1pool" fails c32 checksum decoding.
const VALID_ADDRESS = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";
const VALID_POOL_ADDRESS = `${VALID_ADDRESS}.native-pool-signer-manager`;

describe("StakeFlowModal/StepValidatorFooter", () => {
  const withValidatorFields = (overrides: Partial<Transaction> = {}) =>
    makeProps({
      transaction: makeTransaction({
        valAddress: VALID_POOL_ADDRESS,
        familySpecificData: { numCycles: 1 },
        ...overrides,
      }),
    });

  it("disables Continue when valAddress has no '.' (not a contract principal shape)", () => {
    const props = withValidatorFields({ valAddress: "SP1pool-no-dot" });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it.each(["foo.bar", `${VALID_ADDRESS}.`, "foo."])(
    "disables Continue when valAddress is %s (invalid address or empty contract name)",
    valAddress => {
      const props = withValidatorFields({ valAddress });
      act(() => {
        render(<StepValidatorFooter {...props} />);
      });
      expect(screen.getByRole("button")).toBeDisabled();
    },
  );

  it("disables Continue when the address part is not c32-decodable, even with a dot and a plausible contract name", () => {
    const props = withValidatorFields({
      valAddress: "SP1not-an-address.native-pool-signer-manager",
    });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it.each([0, 97, NaN])("disables Continue when numCycles is %s", numCycles => {
    const props = withValidatorFields({ familySpecificData: { numCycles } });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it.each([1, 96])("enables Continue for the boundary numCycles value %s", numCycles => {
    const props = withValidatorFields({ familySpecificData: { numCycles } });
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("advances to the amount step when Continue is enabled and clicked", () => {
    const props = withValidatorFields();
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(props.transitionTo).toHaveBeenCalledWith("amount");
  });
});
