import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import type { StakePositionState } from "../../types";
import { StakePositionDetails } from "./StakePositionDetails";
import type { StakePositionDetailsProps } from "./StakePositionDetails.types";

type DataProps = Omit<StakePositionDetailsProps, "onEarnMore" | "onSelectExitAction">;

const PROPS: DataProps = {
  ticker: "SOL",
  state: "active",
  balance: { crypto: "12.5 SOL", fiat: "$1,875.00" },
  rewards: { crypto: "0.42 SOL", fiat: "$63.00" },
  apy: "7.81%",
  validator: { name: "Ledger by Figment", imageUrl: "https://validators.example/ledger.png" },
  address: `StakeA${"b".repeat(32)}Acct42`,
  exitAction: "deactivate",
  notice: null,
  isExitActionPending: false,
};

function renderDetails(overrides: Partial<DataProps> = {}) {
  const onEarnMore = jest.fn();
  const onSelectExitAction = jest.fn();
  render(
    <StakePositionDetails
      {...PROPS}
      {...overrides}
      onEarnMore={onEarnMore}
      onSelectExitAction={onSelectExitAction}
      testID="stake-position-details"
    />,
    { wrapper: I18nWrapper },
  );
  return { onEarnMore, onSelectExitAction, user: userEvent.setup() };
}

const button = (name: string) => screen.getByRole("button", { name });
const queryButton = (name: string) => screen.queryByRole("button", { name });

describe("StakePositionDetails (web)", () => {
  it.each<[StakePositionState, string]>([
    ["active", "Active"],
    ["activating", "Activating"],
    ["deactivating", "Deactivating"],
    ["inactive", "Deactivated"],
  ])("should show the %s status as %p", (state, label) => {
    renderDetails({ state });

    expect(screen.getByText(label)).toBeVisible();
  });

  it("should show the balance, the rewards, the APY, the validator and the stake account", () => {
    renderDetails();

    expect(screen.getByText("12.5 SOL")).toBeVisible();
    expect(screen.getByText("$1,875.00")).toBeVisible();
    expect(screen.getByText("0.42 SOL")).toBeVisible();
    expect(screen.getByText("$63.00")).toBeVisible();
    expect(screen.getByText("7.81%")).toBeVisible();
    expect(screen.getByText("Ledger by Figment")).toBeVisible();
    expect(screen.getByText("StakeA…Acct42")).toBeVisible();
  });

  it("should show the APY as unavailable when it is unknown", () => {
    renderDetails({ apy: undefined });

    expect(screen.getByText(STAKE_POSITION_COPY.details.unavailableValue)).toBeVisible();
  });

  it("should hide the rewards when they are unknown", () => {
    renderDetails({ rewards: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.rewards)).not.toBeInTheDocument();
  });

  it("should show the crypto amount alone when there is no fiat value", () => {
    renderDetails({ balance: { crypto: "12.5 SOL" } });

    expect(screen.getByText("12.5 SOL")).toBeVisible();
    expect(screen.queryByText("$1,875.00")).not.toBeInTheDocument();
  });

  it("should offer to deactivate the position next to Earn more", () => {
    renderDetails({ exitAction: "deactivate" });

    expect(button("Deactivate to withdraw")).toBeEnabled();
    expect(button("Earn more")).toBeEnabled();
    expect(queryButton("Withdraw all")).not.toBeInTheDocument();
  });

  it("should offer to withdraw all of the position", () => {
    renderDetails({ state: "inactive", exitAction: "withdraw" });

    expect(button("Withdraw all")).toBeEnabled();
    expect(queryButton("Deactivate to withdraw")).not.toBeInTheDocument();
  });

  it("should offer only Earn more when the position has no exit", () => {
    renderDetails({ state: "deactivating", exitAction: null, notice: "deactivating" });

    expect(queryButton("Deactivate to withdraw")).not.toBeInTheDocument();
    expect(queryButton("Withdraw all")).not.toBeInTheDocument();
    expect(button("Earn more")).toBeEnabled();
  });

  it("should disable the exit, but not Earn more, while the exit waits", () => {
    renderDetails({ isExitActionPending: true });

    expect(button("Deactivate to withdraw")).toBeDisabled();
    expect(button("Earn more")).toBeEnabled();
  });

  it("should hand the exit of the position to the app", async () => {
    const { onSelectExitAction, onEarnMore, user } = renderDetails({
      state: "inactive",
      exitAction: "withdraw",
    });

    await user.click(button("Withdraw all"));

    expect(onSelectExitAction).toHaveBeenCalledWith("withdraw");
    expect(onEarnMore).not.toHaveBeenCalled();
  });

  it("should hand Earn more to the app", async () => {
    const { onSelectExitAction, onEarnMore, user } = renderDetails();

    await user.click(button("Earn more"));

    expect(onEarnMore).toHaveBeenCalledTimes(1);
    expect(onSelectExitAction).not.toHaveBeenCalled();
  });

  it.each([
    ["deactivating", "Deactivation in progress. You can withdraw your SOL once it is complete."],
    [
      "missingAuthority",
      "You can't change this position from this account. Another wallet may control it, or a lockup may apply.",
    ],
  ] as const)("should explain the %s notice", (notice, text) => {
    renderDetails({ exitAction: null, notice });

    expect(screen.getByText(text)).toBeVisible();
  });
});
