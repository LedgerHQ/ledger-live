import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Download } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import type { StakePositionExitAction } from "../../types";
import { StakePositionConfirm } from "./StakePositionConfirm";
import type { StakePositionConfirmProps } from "./StakePositionConfirm.types";

jest.mock("@shared/ui-info-state", () => {
  const infoState =
    jest.requireActual<typeof import("@shared/ui-info-state")>("@shared/ui-info-state");
  return { ...infoState, InfoState: jest.fn(infoState.InfoState) };
});

type DataProps = Omit<StakePositionConfirmProps, "onConfirm">;

const PROPS: DataProps = {
  ticker: "SOL",
  action: "deactivate",
  amount: "12.5 SOL",
  validatorName: "Ledger by Figment",
  accountName: "Solana 1",
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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should describe the deactivation with its amount and validator, and confirm it", () => {
    renderConfirm({ action: "deactivate" });

    expect(screen.getByRole("heading", { name: "Deactivate your SOL" })).toBeVisible();
    expect(
      screen.getByText(
        "Your 12.5 SOL in Ledger by Figment will be deactivated. Once deactivated, you will be able to withdraw your funds. It may take a few days to complete deactivation.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Deactivate" })).toBeEnabled();
  });

  it("should describe the withdrawal with its amount, validator and account, and confirm it", () => {
    renderConfirm({ action: "withdraw" });

    expect(screen.getByRole("heading", { name: "Withdraw SOL" })).toBeVisible();
    expect(
      screen.getByText(
        "Your 12.5 SOL in Ledger by Figment will be withdrawn to your Solana 1 account. This may take a few minutes.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Withdraw all" })).toBeEnabled();
  });

  it.each<StakePositionExitAction>(["deactivate", "withdraw"])(
    "should lead the %s confirmation with the download spot over the muted glow",
    action => {
      renderConfirm({ action });

      expect(jest.mocked(InfoState).mock.lastCall?.[0]).toMatchObject({
        preset: "spot",
        spotProps: { icon: Download },
        backgroundTone: "info",
      });
    },
  );

  it("should name the ticker as the account while the account has no name", () => {
    renderConfirm({ action: "withdraw", accountName: undefined });

    expect(screen.getByText(/will be withdrawn to your SOL account\./)).toBeVisible();
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
    expect(jest.mocked(InfoState).mock.lastCall?.[0].primaryCta).toMatchObject({ loading: true });
  });

  it("should hand the confirmation to the app", async () => {
    const { onConfirm, user } = renderConfirm();

    await user.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
