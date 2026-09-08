import React from "react";
import { render, screen } from "@tests/test-renderer";
import StakingValidationSuccess from "../StakingFlow/04-ValidationSuccess";
import { createMockMinaAccount, createMockOperation } from "./testUtils";
import { ScreenName } from "~/const";

const navigate = jest.fn();
const pop = jest.fn();
const account = createMockMinaAccount();
const operation = createMockOperation();

const props = {
  navigation: { navigate, getParent: () => ({ pop }) } as never,
  route: {
    params: {
      accountId: account.id,
      deviceId: "device-1",
      transaction: { family: "mina", recipient: account.freshAddress },
      result: operation,
    },
  } as never,
};

function renderScreen() {
  return render(<StakingValidationSuccess {...props} />, {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    }),
  });
}

describe("StakingValidationSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("announces the broadcast with the mina copy", () => {
    renderScreen();

    expect(screen.getByTestId("validate-success-screen")).toBeOnTheScreen();
    expect(screen.getByText("Transaction successfully broadcasted")).toBeOnTheScreen();
    expect(
      screen.getByText("Your delegation change request has been broadcasted."),
    ).toBeOnTheScreen();
  });

  it("leaves the flow when the screen is closed", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("Close"));

    expect(pop).toHaveBeenCalled();
  });

  it("opens the operation of the account it was given", async () => {
    const { user } = renderScreen();

    await user.press(screen.getByText("View details"));

    expect(navigate).toHaveBeenCalledWith(ScreenName.OperationDetails, {
      accountId: account.id,
      operation,
    });
  });
});
