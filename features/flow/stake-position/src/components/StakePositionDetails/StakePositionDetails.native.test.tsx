import React from "react";
import { Text } from "react-native";
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
  ])("should show the %s status as %p", (status, label) => {
    renderDetails({ status });

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("should show the rewards, the balance, the APY, the account and the validator", () => {
    renderDetails({ accountIcon: <Text>account-icon</Text> });

    expect(screen.getByText(STAKE_POSITION_COPY.details.totalRewards)).toBeTruthy();
    expect(screen.getByText("0.42 SOL")).toBeTruthy();
    expect(screen.getByText("12.5 SOL")).toBeTruthy();
    expect(screen.getByText(STAKE_POSITION_COPY.details.currentBalance)).toBeTruthy();
    expect(screen.getByText("7.12% APY")).toBeTruthy();
    expect(screen.getByText("Solana 1")).toBeTruthy();
    expect(screen.getByText("account-icon")).toBeTruthy();
    expect(screen.getByText("Ledger by Figment")).toBeTruthy();
  });

  it("should show no initial deposit row, like its design, even when the backend sends it", () => {
    renderDetails();

    expect(screen.queryByText(STAKE_POSITION_COPY.details.initialDeposit)).toBeNull();
    expect(screen.queryByText("12.08 SOL")).toBeNull();
  });

  it("should hide the APY row when the position has no rate", () => {
    renderDetails({ apy: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.apy)).toBeNull();
  });

  it("should name the type of the rate the backend sends", () => {
    renderDetails({ apy: { value: "5.45%", type: "APR" } });

    expect(screen.getByText("5.45% APR")).toBeTruthy();
    expect(screen.queryByText("5.45% APY")).toBeNull();
  });

  it("should hide the rewards when they are unknown", () => {
    renderDetails({ totalRewards: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.totalRewards)).toBeNull();
  });

  it("should hide the account and the validator rows without them", () => {
    renderDetails({ accountName: undefined, validator: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.details.account)).toBeNull();
    expect(screen.queryByText(STAKE_POSITION_COPY.details.validator)).toBeNull();
  });

  it("should offer to deactivate the position next to Earn more", () => {
    renderDetails({ exitAction: "deactivate" });

    expect(button("Deactivate")).toBeEnabled();
    expect(button("Earn more")).toBeEnabled();
    expect(queryButton("Withdraw")).toBeNull();
  });

  it("should offer to withdraw the position, without Earn more when it is not offered", () => {
    renderDetails({ status: "inactive", exitAction: "withdraw", showEarnMore: false });

    expect(button("Withdraw")).toBeEnabled();
    expect(queryButton("Deactivate")).toBeNull();
    expect(queryButton("Earn more")).toBeNull();
  });

  it("should disable the exit, but not Earn more, while the exit waits", () => {
    renderDetails({ isExitActionPending: true });

    expect(button("Deactivate")).toBeDisabled();
    expect(button("Earn more")).toBeEnabled();
  });

  it("should hand the exit of the position to the app", () => {
    const { onSelectExitAction, onEarnMore } = renderDetails();

    fireEvent.press(button("Deactivate"));

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
    ["updating", "This position is updating. Some details may be out of date."],
  ] as const)("should explain the %s notice", (notice, text) => {
    renderDetails({ exitAction: null, notice });

    expect(screen.getByText(text)).toBeTruthy();
  });
});
