import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import type { StakePositionState } from "../../types";
import { StakePositionDetails } from "./StakePositionDetails";
import type { StakePositionDetailsProps } from "./StakePositionDetails.types";

jest.mock("@ledgerhq/lumen-ui-rnative", () =>
  jest
    .requireActual<typeof import("../../__tests__/lumenNativeMock")>(
      "../../__tests__/lumenNativeMock",
    )
    .lumenNativeWithAccessibleButtons(),
);

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
  return { onEarnMore, onSelectExitAction };
}

const button = (name: string) => screen.getByRole("button", { name });
const queryButton = (name: string) => screen.queryByRole("button", { name });

describe("StakePositionDetails (native)", () => {
  it.each<[StakePositionState, string]>([
    ["active", "Active"],
    ["activating", "Activating"],
    ["deactivating", "Deactivating"],
    ["inactive", "Deactivated"],
  ])("should show the %s status as %p", (state, label) => {
    renderDetails({ state });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("should show the balance, the rewards, the APY, the validator and the stake account", () => {
    renderDetails();

    expect(screen.getByText("12.5 SOL")).toBeTruthy();
    expect(screen.getByText("$1,875.00")).toBeTruthy();
    expect(screen.getByText("0.42 SOL")).toBeTruthy();
    expect(screen.getByText("$63.00")).toBeTruthy();
    expect(screen.getByText("7.81%")).toBeTruthy();
    expect(screen.getByText("Ledger by Figment")).toBeTruthy();
    expect(screen.getByText("StakeA…Acct42")).toBeTruthy();
  });

  it("should show the APY as unavailable when it is unknown", () => {
    renderDetails({ apy: undefined });

    expect(screen.getByText(STAKE_POSITION_COPY.details.unavailableValue)).toBeTruthy();
  });

  it("should hide the rewards when they are unknown", () => {
    renderDetails({ rewards: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.rewards)).toBeNull();
  });

  it("should show the crypto amount alone when there is no fiat value", () => {
    renderDetails({ balance: { crypto: "12.5 SOL" } });

    expect(screen.getByText("12.5 SOL")).toBeTruthy();
    expect(screen.queryByText("$1,875.00")).toBeNull();
  });

  it("should offer to deactivate the position next to Earn more", () => {
    renderDetails({ exitAction: "deactivate" });

    expect(button("Deactivate to withdraw")).toBeEnabled();
    expect(button("Earn more")).toBeEnabled();
    expect(queryButton("Withdraw all")).toBeNull();
  });

  it("should offer to withdraw all of the position", () => {
    renderDetails({ state: "inactive", exitAction: "withdraw" });

    expect(button("Withdraw all")).toBeEnabled();
    expect(queryButton("Deactivate to withdraw")).toBeNull();
  });

  it("should offer only Earn more when the position has no exit", () => {
    renderDetails({ state: "deactivating", exitAction: null, notice: "deactivating" });

    expect(queryButton("Deactivate to withdraw")).toBeNull();
    expect(queryButton("Withdraw all")).toBeNull();
    expect(button("Earn more")).toBeEnabled();
  });

  it("should disable the exit, but not Earn more, while the exit waits", () => {
    renderDetails({ isExitActionPending: true });

    expect(button("Deactivate to withdraw")).toBeDisabled();
    expect(button("Earn more")).toBeEnabled();
  });

  it("should hand the exit of the position to the app", () => {
    const { onSelectExitAction, onEarnMore } = renderDetails();

    fireEvent.press(button("Deactivate to withdraw"));

    expect(onSelectExitAction).toHaveBeenCalledWith("deactivate");
    expect(onEarnMore).not.toHaveBeenCalled();
  });

  it("should hand Earn more to the app", () => {
    const { onSelectExitAction, onEarnMore } = renderDetails();

    fireEvent.press(button("Earn more"));

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

    expect(screen.getByText(text)).toBeTruthy();
  });
});
