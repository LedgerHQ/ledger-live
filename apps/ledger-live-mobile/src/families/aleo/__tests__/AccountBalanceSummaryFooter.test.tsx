import React from "react";
import { render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

const baseAleoResources = {
  transparentBalance: new BigNumber(600000),
  provableApi: null,
  privateBalance: new BigNumber(400000),
  unspentPrivateRecords: null,
  lastPrivateSyncDate: null,
};

const baseAccount: AleoAccount = {
  ...(ALEO_ACCOUNT_1 as AleoAccount),
  balance: new BigNumber(1000000),
  aleoResources: baseAleoResources,
};

describe("AccountBalanceSummaryFooter", () => {
  it("renders transparent and private balance items when both are present", () => {
    render(<AccountBalanceSummaryFooter account={baseAccount} />);

    expect(screen.getByText("Transparent balance")).toBeOnTheScreen();
    expect(screen.getByText("Private balance")).toBeOnTheScreen();
  });

  it("shows *** for private balance when privateBalance is null (not yet synced)", () => {
    const account: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAleoResources, privateBalance: null },
    };

    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("Transparent balance")).toBeOnTheScreen();
    expect(screen.getByText("Private balance")).toBeOnTheScreen();
    expect(screen.getByText("***")).toBeOnTheScreen();
  });

  it("renders private balance value when privateBalance is zero", () => {
    const account: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAleoResources, privateBalance: new BigNumber(0) },
    };

    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("Transparent balance")).toBeOnTheScreen();
    expect(screen.getByText("Private balance")).toBeOnTheScreen();
    expect(screen.queryByText("***")).not.toBeOnTheScreen();
  });

  it("returns null when aleoResources is missing", () => {
    const account: AleoAccount = {
      ...baseAccount,
      aleoResources: undefined,
    };

    const { toJSON } = render(<AccountBalanceSummaryFooter account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("returns null when balance is zero", () => {
    const account: AleoAccount = {
      ...baseAccount,
      balance: new BigNumber(0),
    };

    const { toJSON } = render(<AccountBalanceSummaryFooter account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("returns null when balance is negative", () => {
    const account: AleoAccount = {
      ...baseAccount,
      balance: new BigNumber(-1),
    };

    const { toJSON } = render(<AccountBalanceSummaryFooter account={account} />);
    expect(toJSON()).toBeNull();
  });
});
