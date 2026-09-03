import React from "react";
import { render, screen } from "@tests/test-renderer";
import ValidatorRow from "../StakingFlow/ValidatorRow";
import { createMockMinaAccount, mockValidators } from "./testUtils";

const onPress = jest.fn();
const [unit] = createMockMinaAccount().currency.units;

function renderRow(validator = mockValidators[0]) {
  return render(<ValidatorRow validator={validator} onPress={onPress} unit={unit} />);
}

describe("ValidatorRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the validator name", () => {
    renderRow();

    expect(screen.getByText("Validator Alpha")).toBeOnTheScreen();
  });

  it("displays the validator commission fee", () => {
    renderRow();

    expect(screen.getByText(/Commission/)).toBeOnTheScreen();
    expect(screen.getByText(/5%/)).toBeOnTheScreen();
  });

  it("displays the validator stake with unit code", () => {
    renderRow();

    expect(screen.getByText(/5,000,000 MINA/)).toBeOnTheScreen();
  });

  it("calls onPress with the validator when pressed", async () => {
    const { user } = renderRow();

    await user.press(screen.getByText("Validator Alpha"));

    expect(onPress).toHaveBeenCalledWith(mockValidators[0]);
  });

  it("falls back to address when validator has no name", () => {
    const noNameValidator = { ...mockValidators[0], name: "" };
    renderRow(noNameValidator);

    expect(screen.getByText(noNameValidator.address)).toBeOnTheScreen();
  });
});
