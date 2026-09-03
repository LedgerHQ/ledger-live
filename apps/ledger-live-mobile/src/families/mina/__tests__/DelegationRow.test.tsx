import React from "react";
import { render, screen } from "@tests/test-renderer";
import DelegationRow from "../Delegations/Row";
import { createDelegatingMinaAccount, mockValidators } from "./testUtils";

const onPress = jest.fn();
const [unit] = createDelegatingMinaAccount().currency.units;

function renderRow(account = createDelegatingMinaAccount(mockValidators[0])) {
  return render(
    <DelegationRow account={account} currency={account.currency} unit={unit} onPress={onPress} />,
  );
}

describe("Delegations/Row", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the validator identity name and the formatted balance", () => {
    renderRow();

    expect(screen.getByText("Validator Alpha")).toBeOnTheScreen();
    expect(screen.getByText("10 MINA")).toBeOnTheScreen();
    expect(screen.getByText("See more")).toBeOnTheScreen();
  });

  it("falls back to the delegate address when the validator has no identity name", () => {
    const validator = { ...mockValidators[0], identityName: "" };
    renderRow(createDelegatingMinaAccount(validator));

    expect(screen.getByText(validator.address)).toBeOnTheScreen();
  });

  it("falls back to a dash when the delegate metadata is missing", () => {
    renderRow(createDelegatingMinaAccount(null));

    // The avatar draws the first letter of the same name, so it falls back with it. The third
    // dash is the counter-value placeholder, which has no rate to show in a test.
    expect(screen.getAllByText("-")).toHaveLength(3);
  });

  it("calls onPress with the account when the row is pressed", async () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    const { user } = renderRow(account);

    await user.press(screen.getByText("Validator Alpha"));

    expect(onPress).toHaveBeenCalledWith(account);
  });
});
