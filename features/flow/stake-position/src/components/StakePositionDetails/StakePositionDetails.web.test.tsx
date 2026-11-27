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
  status: "active",
  totalRewards: { crypto: "0.42 SOL", fiat: "$63.00" },
  currentBalance: { crypto: "12.5 SOL", fiat: "$1,875.00" },
  initialDepositCrypto: "12.08 SOL",
  initialDepositFiat: "$1,812.00",
  apy: { value: "7.12%", type: "APY" },
  apyAppearance: "success",
  validator: { name: "Ledger by Figment", imageUrl: "https://validators.example/ledger.png" },
  accountName: "Solana 1",
  exitAction: "deactivate",
  isExitActionPending: false,
  notice: null,
  showEarnMore: true,
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
  ])("should show the %s status as %p", (status, label) => {
    renderDetails({ status });

    expect(screen.getByText(label)).toBeVisible();
  });

  it("should show the rewards, the balance, the initial deposit, the APY, the account and the validator", () => {
    renderDetails();

    expect(screen.getByText(STAKE_POSITION_COPY.details.totalRewards)).toBeVisible();
    expect(screen.getByText("0.42 SOL")).toBeVisible();
    expect(screen.getByText("12.5 SOL")).toBeVisible();
    expect(screen.getByText(STAKE_POSITION_COPY.details.currentBalance)).toBeVisible();
    expect(screen.getByText(STAKE_POSITION_COPY.details.initialDeposit)).toBeVisible();
    expect(screen.getByText("12.08 SOL")).toBeVisible();
    expect(screen.getByText("$1,812.00")).toBeVisible();
    expect(screen.getByText("7.12% APY")).toBeVisible();
    expect(screen.getByText("Solana 1")).toBeVisible();
    expect(screen.getByText("Ledger by Figment")).toBeVisible();
  });

  it("should show the balance in crypto only, and no stake account row", () => {
    renderDetails();

    expect(screen.queryByText("$1,875.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Stake account")).not.toBeInTheDocument();
  });

  it("should hide the initial deposit row when the backend sends no deposited amount", () => {
    renderDetails({ initialDepositCrypto: undefined, initialDepositFiat: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.initialDeposit)).not.toBeInTheDocument();
  });

  it("should show the initial deposit in crypto alone without a counter value", () => {
    renderDetails({ initialDepositFiat: undefined });

    expect(screen.getByText("12.08 SOL")).toBeVisible();
    expect(screen.queryByText("$1,812.00")).not.toBeInTheDocument();
  });

  it("should hide the initial deposit row with a counter value but no crypto amount", () => {
    renderDetails({ initialDepositCrypto: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.initialDeposit)).not.toBeInTheDocument();
    expect(screen.queryByText("$1,812.00")).not.toBeInTheDocument();
  });

  it("should hide the APY row when the position has no rate", () => {
    renderDetails({ apy: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.apy)).not.toBeInTheDocument();
    expect(screen.queryByText(/\sAPY$/)).not.toBeInTheDocument();
  });

  it("should name the type of the rate the backend sends", () => {
    renderDetails({ apy: { value: "5.45%", type: "APR" } });

    expect(screen.getByText("5.45% APR")).toBeVisible();
    expect(screen.queryByText("5.45% APY")).not.toBeInTheDocument();
  });

  it.each(["success", "gray"] as const)(
    "should show the rate in the %s appearance",
    apyAppearance => {
      renderDetails({ apyAppearance });

      expect(screen.getByText("7.12% APY")).toHaveAttribute("appearance", apyAppearance);
    },
  );

  it("should hide the rewards when they are unknown", () => {
    renderDetails({ totalRewards: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.totalRewards)).not.toBeInTheDocument();
    expect(screen.queryByTestId("stake-position-rewards")).not.toBeInTheDocument();
  });

  it("should lead with the rewards in crypto when there is no counter value", () => {
    renderDetails({ totalRewards: { crypto: "0.42 SOL" }, rewardsHeadline: undefined });

    expect(screen.getByText(STAKE_POSITION_COPY.details.totalRewards)).toBeVisible();
    expect(screen.getByText("0.42 SOL")).toBeVisible();
  });

  it("should keep the exit when the backend sends no balance", () => {
    renderDetails({ currentBalance: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.currentBalance)).not.toBeInTheDocument();
    expect(button("Deactivate")).toBeEnabled();
  });

  it("should show the account name next to its icon", () => {
    renderDetails({ accountIcon: <span data-testid="account-icon" /> });

    expect(screen.getByText(STAKE_POSITION_COPY.details.account)).toBeVisible();
    expect(screen.getByTestId("account-icon")).toBeVisible();
  });

  it("should hide the account row when the account has no name", () => {
    renderDetails({ accountName: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.account)).not.toBeInTheDocument();
  });

  it("should show the initial of a validator without a logo", () => {
    renderDetails({ validator: { name: "26pV97…c53dJx" } });

    expect(screen.getByText("26pV97…c53dJx")).toBeVisible();
    expect(screen.getByRole("img")).toHaveTextContent("2");
  });

  it("should hide the validator row of a position without a validator", () => {
    renderDetails({ validator: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.validator)).not.toBeInTheDocument();
  });

  it("should offer to deactivate the position next to Earn more", () => {
    renderDetails({ exitAction: "deactivate" });

    expect(button("Deactivate")).toBeEnabled();
    expect(button("Earn more")).toBeEnabled();
    expect(queryButton("Withdraw")).not.toBeInTheDocument();
  });

  it("should offer to withdraw the position, without Earn more when it is not offered", () => {
    renderDetails({ status: "inactive", exitAction: "withdraw", showEarnMore: false });

    expect(button("Withdraw")).toBeEnabled();
    expect(queryButton("Deactivate")).not.toBeInTheDocument();
    expect(queryButton("Earn more")).not.toBeInTheDocument();
  });

  it("should offer no exit and no Earn more on a deactivating position", () => {
    renderDetails({
      status: "deactivating",
      exitAction: null,
      notice: "deactivating",
      showEarnMore: false,
    });

    expect(queryButton("Deactivate")).not.toBeInTheDocument();
    expect(queryButton("Withdraw")).not.toBeInTheDocument();
    expect(queryButton("Earn more")).not.toBeInTheDocument();
  });

  it("should disable the exit, but not Earn more, while the exit waits", () => {
    renderDetails({ isExitActionPending: true });

    expect(button("Deactivate")).toBeDisabled();
    expect(button("Earn more")).toBeEnabled();
  });

  it("should hand the exit of the position to the app", async () => {
    const { onSelectExitAction, onEarnMore, user } = renderDetails({
      status: "inactive",
      exitAction: "withdraw",
    });

    await user.click(button("Withdraw"));

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
    ["updating", "This position is updating. Some details may be out of date."],
  ] as const)("should explain the %s notice", (notice, text) => {
    renderDetails({ exitAction: null, notice });

    expect(screen.getByText(text)).toBeVisible();
  });
});
