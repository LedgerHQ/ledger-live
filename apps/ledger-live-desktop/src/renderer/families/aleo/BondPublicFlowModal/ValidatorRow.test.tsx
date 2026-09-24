import React from "react";
import { render, screen, userEvent } from "tests/testSetup";
import type { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import { openURL } from "~/renderer/linking";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { ALEO_VALIDATOR_ADDRESS, aleoValidator } from "../__mocks__/validator.mock";
import AleoValidatorRow from "./ValidatorRow";

jest.mock("~/renderer/linking", () => ({
  __esModule: true,
  ...jest.requireActual("~/renderer/linking"),
  openURL: jest.fn(),
}));

const mockOpenURL = jest.mocked(openURL);

function setup(overrides: Partial<AleoValidator> = {}, props: { locked?: boolean } = {}) {
  const onSelect = jest.fn();
  const utils = render(
    <AleoValidatorRow
      validator={aleoValidator(overrides)}
      currency={ALEO_MAIN_ACCOUNT.currency}
      selected={false}
      locked={props.locked ?? false}
      onSelect={onSelect}
    />,
    { initialState: { settings: AFTER_ONBOARDING_STATE } },
  );

  return { ...utils, onSelect };
}

const row = () => screen.getByTestId("modal-provider-row");

describe("AleoValidatorRow — subtitle", () => {
  it("shows the yearly rate alongside the commission", () => {
    setup();

    expect(screen.getByText("6.2% est. · 5% commission")).toBeInTheDocument();
  });

  it("falls back to the commission alone when no rate is known", () => {
    setup({ estimatedYearlyRewardsRate: undefined });

    expect(screen.getByText("5% commission")).toBeInTheDocument();
  });

  // Unbonding outranks the others: the chain rejects the bond outright, so the reason the
  // validator also earns nothing is beside the point.
  it("reports unbonding ahead of any other warning", () => {
    setup({ isUnbonding: true, isOpen: false, nonEarningReason: "overConcentrated" });

    expect(screen.getByText("Validator is unbonding")).toBeInTheDocument();
    expect(screen.queryByText("Validator is closed to new stake")).not.toBeInTheDocument();
  });

  it("reports a closed validator ahead of a non-earning reason", () => {
    setup({ isOpen: false, nonEarningReason: "overConcentrated" });

    expect(screen.getByText("Validator is closed to new stake")).toBeInTheDocument();
    expect(screen.queryByText("Validator earns no rewards")).not.toBeInTheDocument();
  });

  it.each(["overConcentrated", "fullCommission"])("reports %s as earning nothing", reason => {
    setup({ nonEarningReason: reason as AleoValidator["nonEarningReason"] });

    expect(screen.getByText("Validator earns no rewards")).toBeInTheDocument();
    expect(screen.queryByText(/commission$/)).not.toBeInTheDocument();
  });
});

describe("AleoValidatorRow — selection", () => {
  it("selects the validator when its row is clicked", async () => {
    const { onSelect } = setup();

    await userEvent.click(row());

    expect(onSelect).toHaveBeenCalledWith(ALEO_VALIDATOR_ADDRESS);
  });

  it("does not select a validator that cannot take stake", async () => {
    const { onSelect } = setup({ isUnbonding: true });

    await userEvent.click(row());

    expect(onSelect).not.toHaveBeenCalled();
  });

  // Locked means it is already the only legal target, so there is nothing to pick.
  it("does not select a locked validator", async () => {
    const { onSelect } = setup({}, { locked: true });

    await userEvent.click(row());

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("opens the explorer from the validator name, even when unpickable", async () => {
    setup({ isUnbonding: true });

    await userEvent.click(screen.getByText("Figment"));

    expect(mockOpenURL).toHaveBeenCalledWith(expect.stringContaining(ALEO_VALIDATOR_ADDRESS));
  });
});
