import React from "react";
import { render, screen } from "tests/testSetup";
import { useNetworkValidators } from "@domain/api-network-validators";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { NetworkValidator } from "@domain/entity-network-validators";
import type { CosmosValidatorItem } from "@ledgerhq/live-common/families/cosmos/types";
import { openURL } from "~/renderer/linking";
import CosmosFamilyValidatorRow from "../CosmosFamilyValidatorRow";
import CosmosFamilyLedgerValidatorIcon from "../CosmosFamilyLedgerValidatorIcon";

jest.mock("@domain/api-network-validators", () => ({
  ...jest.requireActual("@domain/api-network-validators"),
  useNetworkValidators: jest.fn(),
}));
jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

const currency = getCryptoCurrencyById("cosmos");
const unit = currency.units[0];
const LEDGER: NetworkValidator = { id: "cosmosvaloper1ledger", name: "Ledger", isLedger: true };
const OTHER: NetworkValidator = { id: "cosmosvaloper1other", name: "Other" };

const item = ({ id, name }: NetworkValidator): CosmosValidatorItem => ({
  validatorAddress: id,
  name,
  votingPower: 0,
  commission: 0.05,
  estimatedYearlyRewardsRate: 0.1,
  tokens: "1000000",
});

const mockValidators = (validators: NetworkValidator[]) =>
  jest
    .mocked(useNetworkValidators)
    .mockReturnValue({ validators, pending: false, error: undefined });

describe("Cosmos validator Ledger badge and link", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidators([LEDGER, OTHER]);
  });

  it("shows the Ledger logo only for a validator flagged isLedger", () => {
    render(<CosmosFamilyLedgerValidatorIcon currency={currency} validator={item(LEDGER)} />);
    expect(screen.getByTestId("logo")).toBeVisible();
  });

  it("shows the first letter for a validator without the flag", () => {
    render(<CosmosFamilyLedgerValidatorIcon currency={currency} validator={item(OTHER)} />);
    expect(screen.queryByTestId("logo")).not.toBeInTheDocument();
  });

  it("shows no Ledger logo while the validators are not loaded", () => {
    mockValidators([]);
    render(<CosmosFamilyLedgerValidatorIcon currency={currency} validator={item(LEDGER)} />);
    expect(screen.queryByTestId("logo")).not.toBeInTheDocument();
  });

  it("opens the Ledger staking page from the Ledger validator's row", async () => {
    const { user } = render(
      <CosmosFamilyValidatorRow currency={currency} validator={item(LEDGER)} unit={unit} />,
    );
    await user.click(screen.getByText("Ledger"));
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("ledger.com"));
  });

  it("opens the explorer from another validator's row", async () => {
    const { user } = render(
      <CosmosFamilyValidatorRow currency={currency} validator={item(OTHER)} unit={unit} />,
    );
    await user.click(screen.getByText("Other"));
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("cosmosvaloper1other"));
  });
});
