import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { TrackScreen } from "@shared/analytics-react";
import StakingValidationError from "../StakingFlow/ValidationError";
import UnstakingValidationError from "../UnstakingFlow/ValidationError";

const parent = { pop: jest.fn() };
const navigation = { goBack: jest.fn(), getParent: jest.fn(() => parent) };

const renderScreen = (Screen: typeof StakingValidationError | typeof UnstakingValidationError) =>
  render(
    <Screen
      navigation={navigation as never}
      route={
        { params: { accountId: "stacks-account", error: new Error("broadcast failed") } } as never
      }
    />,
  );

describe("Stacks ValidationError", () => {
  beforeEach(() => {
    jest.mocked(TrackScreen).mockClear();
    navigation.goBack.mockReset();
    parent.pop.mockReset();
  });

  it.each([
    ["stake", StakingValidationError, "StacksStakingFlow", "delegate"],
    ["unstake", UnstakingValidationError, "StacksUnstakingFlow", "undelegate"],
  ] as const)("tracks the %s flow", (_, Screen, category, action) => {
    renderScreen(Screen);

    expect(TrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        category,
        name: "ValidationError",
        flow: "stake",
        action,
        currency: "stx",
      }),
      undefined,
    );
  });

  it.each([
    ["stake", StakingValidationError],
    ["unstake", UnstakingValidationError],
  ] as const)(
    "retries the %s flow by going back, and closes it by popping the parent",
    (_, Screen) => {
      renderScreen(Screen);

      fireEvent.press(screen.getByText("Retry"));
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      expect(parent.pop).not.toHaveBeenCalled();

      fireEvent.press(screen.getByText("Close"));
      expect(parent.pop).toHaveBeenCalledTimes(1);
    },
  );
});
