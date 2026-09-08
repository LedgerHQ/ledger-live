import React from "react";
import { render, screen } from "@tests/test-renderer";
import StakingValidationError from "../StakingFlow/04-ValidationError";
import { createMockMinaAccount } from "./testUtils";

const goBack = jest.fn();
const parentGoBack = jest.fn();
const account = createMockMinaAccount();

const props = {
  navigation: { goBack, getParent: () => ({ goBack: parentGoBack }) } as never,
  route: {
    params: {
      accountId: account.id,
      deviceId: "device-1",
      transaction: { family: "mina", recipient: account.freshAddress },
      error: new Error("Transaction broadcast failed"),
    },
  } as never,
};

describe("StakingValidationError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the error with a way out of the flow", () => {
    render(<StakingValidationError {...props} />);

    expect(screen.getByTestId("generic-error-modal")).toBeOnTheScreen();
    expect(screen.getByText("Retry")).toBeOnTheScreen();
    expect(screen.getByText("Close")).toBeOnTheScreen();
  });

  it("returns to the previous step on retry", async () => {
    const { user } = render(<StakingValidationError {...props} />);

    await user.press(screen.getByText("Retry"));

    expect(goBack).toHaveBeenCalled();
  });

  it("leaves the whole flow on close", async () => {
    const { user } = render(<StakingValidationError {...props} />);

    await user.press(screen.getByText("Close"));

    expect(parentGoBack).toHaveBeenCalled();
  });
});
