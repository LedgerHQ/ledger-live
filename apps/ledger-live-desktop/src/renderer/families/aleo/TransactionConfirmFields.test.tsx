import React from "react";
import { render, screen } from "tests/testSetup";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoValidator, Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "./__mocks__/account.mock";
import { makeAleoTransaction } from "./__mocks__/transaction.mock";
import transactionConfirmFields from "./TransactionConfirmFields";
import type { AleoFieldComponentProps } from "./types";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/aleo/react"),
  useAleoValidators: jest.fn(),
}));

const mockUseAleoValidators = jest.mocked(useAleoValidators);

const VALIDATOR_ADDRESS = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const AddressField = transactionConfirmFields.fieldComponents.address;

beforeEach(() => {
  mockUseAleoValidators.mockReturnValue({
    validators: [
      { address: VALIDATOR_ADDRESS, name: "Figment", commissionPercent: 10 } as AleoValidator,
    ],
    loading: false,
    error: null,
  });
});

function setup(
  field: AleoFieldComponentProps["field"],
  mode: Transaction["mode"] = TRANSACTION_TYPE.BOND_PUBLIC,
) {
  return render(
    <AddressField
      field={field}
      account={ALEO_MAIN_ACCOUNT}
      parentAccount={undefined}
      transaction={
        { ...makeAleoTransaction({ recipient: VALIDATOR_ADDRESS }), mode } as Transaction
      }
      status={{ errors: {}, warnings: {} } as AleoFieldComponentProps["status"]}
    />,
    { initialState: { settings: AFTER_ONBOARDING_STATE } },
  );
}

const addressField = (overrides: Record<string, unknown> = {}) =>
  ({
    type: "address",
    label: "To",
    address: VALIDATOR_ADDRESS,
    ...overrides,
  }) as AleoFieldComponentProps["field"];

describe("Aleo TransactionConfirmFields — address field", () => {
  it("always renders the raw address under its own label", () => {
    setup(addressField());

    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText(VALIDATOR_ADDRESS)).toBeInTheDocument();
  });

  it("adds a Validator row naming the recipient when it is a known validator", () => {
    setup(addressField());

    expect(screen.getByText("Validator")).toBeInTheDocument();
    expect(screen.getByText("Figment")).toBeInTheDocument();
  });

  // Any address can be a "To": only a validator the list knows gets the extra row.
  it("omits the Validator row for an address the list does not carry", () => {
    setup(addressField({ address: "aleo1someoneelse" }));

    expect(screen.queryByText("Validator")).not.toBeInTheDocument();
    expect(screen.queryByText("Figment")).not.toBeInTheDocument();
  });

  it("omits the Validator row for a non-To address such as the sender", () => {
    setup(addressField({ label: "From" }));

    expect(screen.getByText(VALIDATOR_ADDRESS)).toBeInTheDocument();
    expect(screen.queryByText("Validator")).not.toBeInTheDocument();
  });

  it("renders nothing for a field that is not an address", () => {
    const { container } = setup({
      type: "amount",
      label: "Amount",
    } as AleoFieldComponentProps["field"]);

    expect(container).toBeEmptyDOMElement();
  });

  describe("validator lookup", () => {
    it("does not fetch validators for a non-bond transaction", () => {
      setup(addressField(), TRANSACTION_TYPE.TRANSFER_PUBLIC);

      expect(mockUseAleoValidators).not.toHaveBeenCalled();
      expect(screen.queryByText("Validator")).not.toBeInTheDocument();
    });

    it("does not fetch validators for the From row of a bond transaction", () => {
      setup(addressField({ label: "From" }));

      expect(mockUseAleoValidators).not.toHaveBeenCalled();
    });

    it("fetches validators only for the bond flow's To row", () => {
      setup(addressField());

      expect(mockUseAleoValidators).toHaveBeenCalled();
    });
  });
});
