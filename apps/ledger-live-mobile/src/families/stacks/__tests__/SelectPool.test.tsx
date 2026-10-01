import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import SelectPool from "../StakingFlow/SelectPool";
import { POOL_ADDRESS } from "../__mocks__/account.mock";

const navigate = jest.fn();

const renderScreen = (params: Record<string, unknown> = {}) =>
  render(
    <SelectPool
      // The screen only uses `navigate` and route params.
      navigation={{ navigate } as never}
      route={
        {
          name: ScreenName.StacksStakingPool,
          params: { accountId: "stacks-account", ...params },
        } as never
      }
    />,
  );

const continueButton = () => screen.getByTestId("stacks-stake-pool-continue");

describe("Stacks staking SelectPool", () => {
  beforeEach(() => navigate.mockReset());

  it("keeps Continue disabled until a valid pool address is entered", () => {
    renderScreen();
    expect(continueButton()).toBeDisabled();

    fireEvent.changeText(screen.getByTestId("stacks-stake-pool-address-input"), "SP1nope.pool");
    expect(continueButton()).toBeDisabled();
    expect(screen.getByText(/Enter a pool contract address/)).toBeVisible();

    fireEvent.changeText(screen.getByTestId("stacks-stake-pool-address-input"), POOL_ADDRESS);
    expect(continueButton()).toBeEnabled();
  });

  it("rejects a number of cycles outside 1-96", () => {
    renderScreen({ valAddress: POOL_ADDRESS });

    fireEvent.changeText(screen.getByTestId("stacks-stake-num-cycles-input"), "97");
    expect(continueButton()).toBeDisabled();
    expect(screen.getByText("Enter a number of cycles between 1 and 96")).toBeVisible();

    fireEvent.changeText(screen.getByTestId("stacks-stake-num-cycles-input"), "");
    expect(continueButton()).toBeDisabled();

    fireEvent.changeText(screen.getByTestId("stacks-stake-num-cycles-input"), "12");
    expect(continueButton()).toBeEnabled();
  });

  it("forwards the pool and cycles to the amount step", () => {
    renderScreen();

    fireEvent.changeText(
      screen.getByTestId("stacks-stake-pool-address-input"),
      ` ${POOL_ADDRESS} `,
    );
    fireEvent.changeText(screen.getByTestId("stacks-stake-num-cycles-input"), "6");
    fireEvent.press(continueButton());

    expect(navigate).toHaveBeenCalledWith(ScreenName.StacksStakingAmount, {
      accountId: "stacks-account",
      parentId: undefined,
      valAddress: POOL_ADDRESS,
      numCycles: 6,
      source: undefined,
    });
  });
});
