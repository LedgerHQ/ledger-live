import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, STAKE_POSITION_COPY } from "../../__tests__/i18nWrapper";
import { StakePositionConfirm } from "./StakePositionConfirm";
import type { StakePositionConfirmProps } from "./StakePositionConfirm.types";

type DataProps = Omit<StakePositionConfirmProps, "onConfirm">;

const PROPS: DataProps = {
  ticker: "SOL",
  action: "deactivate",
  amount: { crypto: "12.5 SOL", fiat: "$1,875.00" },
  validatorName: "Ledger by Figment",
  fees: "0.000005 SOL",
  isPending: false,
  isConfirmDisabled: false,
};

function renderConfirm(overrides: Partial<DataProps> = {}) {
  const onConfirm = jest.fn();
  render(<StakePositionConfirm {...PROPS} {...overrides} onConfirm={onConfirm} />, {
    wrapper: I18nWrapper,
  });
  return { onConfirm, user: userEvent.setup() };
}

describe("StakePositionConfirm (web)", () => {
  it("should describe the deactivation and confirm it", () => {
    renderConfirm({ action: "deactivate" });

    expect(
      screen.getByText(
        "Your SOL will stop earning rewards. Once deactivation is complete, you can withdraw it.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
  });

  it("should describe the withdrawal and confirm it", () => {
    renderConfirm({ action: "withdraw" });

    expect(
      screen.getByText("The full balance of this position goes back to your SOL account."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Withdraw all" })).toBeEnabled();
  });

  it("should show the full amount, the validator and the network fees", () => {
    renderConfirm();

    expect(screen.getByText("12.5 SOL")).toBeVisible();
    expect(screen.getByText("$1,875.00")).toBeVisible();
    expect(screen.getByText("Ledger by Figment")).toBeVisible();
    expect(screen.getByText(STAKE_POSITION_COPY.confirm.fees)).toBeVisible();
    expect(screen.getByText("0.000005 SOL")).toBeVisible();
  });

  it("should hide the network fees while they are unknown", () => {
    renderConfirm({ fees: undefined });

    expect(screen.queryByText(STAKE_POSITION_COPY.confirm.fees)).not.toBeInTheDocument();
  });

  it("should show the error of the transaction", () => {
    renderConfirm({
      errorContent: "Not enough SOL to pay the network fees",
      isConfirmDisabled: true,
    });

    expect(screen.getByText("Not enough SOL to pay the network fees")).toBeVisible();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
  });

  it("should wait for the transaction before the confirmation", () => {
    renderConfirm({ isPending: true });

    expect(screen.getByRole("button", { name: "Deactivate" })).toBeDisabled();
  });

  it("should hand the confirmation to the app", async () => {
    const { onConfirm, user } = renderConfirm();

    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
