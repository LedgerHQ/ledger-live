import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeICPAccount } from "./testUtils";

const bridgeMock = {
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

import SendAmountFields from "../SendAmountFields";

const Fields = SendAmountFields.component;

// TranslatedError resolves copy from `error.name`, so naming the error is the whole fixture — and it
// keeps the test off the coin module's internal file layout.
const warning = (name: string) => Object.assign(new Error(name), { name });

const renderFields = (warnings: TransactionStatus["warnings"]) =>
  render(
    <Fields
      account={makeICPAccount()}
      transaction={
        {
          family: "internet_computer",
          type: "create_neuron",
          amount: new BigNumber(0),
          recipient: "",
          fees: new BigNumber(0),
          memo: "",
        } as Transaction
      }
      status={{ errors: {}, warnings } as TransactionStatus}
      onChange={jest.fn()}
    />,
  );

describe("SendAmountFields (internet_computer)", () => {
  // The bridge files these under `warnings.staking`, which the generic send flow does not read — so
  // until this slot rendered them, a notice the bridge raised on every stake never reached anyone.
  it("surfaces the staking notice raised when creating a neuron", () => {
    renderFields({ staking: warning("ICPCreateNeuronWarning") });

    expect(screen.getByText("This locks your ICP in a new neuron")).toBeInTheDocument();
  });

  it("surfaces the notice raised when topping one up", () => {
    renderFields({ staking: warning("ICPIncreaseStakeWarning") });

    expect(screen.getByText("This adds to a locked stake")).toBeInTheDocument();
  });

  // The class name is what shows through when a key is missing, so it doubles as the check that the
  // notice resolved to real copy rather than falling back.
  it("does not leak the warning's class name", () => {
    const { container } = renderFields({ staking: warning("ICPCreateNeuronWarning") });

    expect(container.textContent).not.toContain("ICPCreateNeuronWarning");
  });

  it("renders nothing extra on an ordinary send", () => {
    renderFields({});

    expect(screen.queryByTestId("icp-staking-warning")).not.toBeInTheDocument();
  });
});
