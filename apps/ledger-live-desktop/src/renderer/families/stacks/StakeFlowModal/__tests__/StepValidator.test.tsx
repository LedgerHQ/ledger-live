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

jest.mock("@shared/analytics-react", () => ({
  ...jest.requireActual("@shared/analytics-react"),
  TrackPage: () => null,
}));

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

  it("clearing the pool address field back to empty also clears mode, instead of leaving mode: 'delegate' with no valAddress", () => {
    // A staking intent with `mode` set but no `valAddress` crashes the generic bridge's pool-address
    // validation (`intent.valAddress.includes(...)` on `undefined`) instead of returning a form error.
    const props = makeProps({ transaction: makeTransaction({ valAddress: "SP1pool.name" }) });
    act(() => {
      render(<StepValidator {...props} />);
    });

    act(() => {
      fireEvent.change(screen.getByTestId("stacks-stake-pool-address-input"), {
        target: { value: "" },
      });
    });

    expect(updateTransactionMock).toHaveBeenCalledWith(props.transaction, {
      mode: undefined,
      valAddress: "",
    });
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

  it.each(["1.5", "-1", "6 cycles"])(
    "leaves numCycles unset for %s instead of turning it into another number of cycles",
    raw => {
      const props = makeProps();
      act(() => {
        render(<StepValidator {...props} />);
      });

      act(() => {
        fireEvent.change(screen.getByTestId("stacks-stake-num-cycles-input"), {
          target: { value: raw },
        });
      });

      expect(screen.getByTestId("stacks-stake-num-cycles-input")).toHaveValue(raw);
      expect(updateTransactionMock).toHaveBeenLastCalledWith(props.transaction, {
        familySpecificData: { numCycles: undefined },
      });
    },
  );

  it("shows a bridge error on the pool step once the stake form is valid", () => {
    act(() => {
      render(
        <StepValidator
          {...makeProps({
            error: new Error("fee estimation failed"),
            transaction: makeTransaction({
              valAddress: VALID_POOL_ADDRESS,
              familySpecificData: { numCycles: 1 },
            }),
          })}
        />,
      );
    });

    expect(screen.getByText(/fee estimation failed/)).toBeInTheDocument();
  });

  it("does not show a bridge error before a pool address is entered", () => {
    act(() => {
      render(<StepValidator {...makeProps({ error: new Error("fee estimation failed") })} />);
    });

    expect(screen.queryByText(/fee estimation failed/)).not.toBeInTheDocument();
  });

  it("shows no validation message while both fields are empty", () => {
    act(() => {
      render(<StepValidator {...makeProps()} />);
    });

    expect(screen.queryByTestId("input-error")).not.toBeInTheDocument();
  });

  it("shows a validation message under an invalid pool address", () => {
    act(() => {
      render(
        <StepValidator {...makeProps({ transaction: makeTransaction({ valAddress: "test" }) })} />,
      );
    });

    expect(screen.getByTestId("input-error")).toHaveTextContent(
      "Enter a valid pool contract address in the address.contract-name format.",
    );
  });

  it.each(["0", "97", "100", "1.5", "ten"])(
    "shows a validation message under a number of cycles of %s",
    raw => {
      act(() => {
        render(<StepValidator {...makeProps()} />);
      });

      act(() => {
        fireEvent.change(screen.getByTestId("stacks-stake-num-cycles-input"), {
          target: { value: raw },
        });
      });

      expect(screen.getByTestId("input-error")).toHaveTextContent(
        "Enter a whole number between 1 and 96.",
      );
    },
  );

  it("shows no validation message for a valid pool address and number of cycles", () => {
    act(() => {
      render(
        <StepValidator
          {...makeProps({
            transaction: makeTransaction({
              valAddress: VALID_POOL_ADDRESS,
              familySpecificData: { numCycles: 96 },
            }),
          })}
        />,
      );
    });

    expect(screen.queryByTestId("input-error")).not.toBeInTheDocument();
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

  it("shows no loading state on Continue for invalid input while the bridge is pending", () => {
    const props = {
      ...withValidatorFields({ valAddress: "test" }),
      bridgePending: true,
    };
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("shows no loading state on Continue for valid input when the bridge fails while pending a retry", () => {
    const props = {
      ...withValidatorFields(),
      bridgePending: true,
      error: new Error("fee estimation failed"),
    };
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("shows the loading state on Continue for valid input while the bridge is pending", () => {
    const props = { ...withValidatorFields(), bridgePending: true };
    act(() => {
      render(<StepValidatorFooter {...props} />);
    });
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
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
