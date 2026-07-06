import React from "react";
import { render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import AccountBalanceHeader from "../AccountBalanceHeader";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "ALEO", name: "Aleo", magnitude: 6 }),
}));

jest.mock("~/components/CurrencyUnitValue", () => ({ __esModule: true, default: () => null }));

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

describe("AccountBalanceHeader", () => {
  it("renders the Balances section title", () => {
    render(<AccountBalanceHeader account={baseAccount} />);

    expect(screen.getByText("aleo.balancesSection")).toBeOnTheScreen();
  });

  it("renders transparent and private balance items when both are present", () => {
    render(<AccountBalanceHeader account={baseAccount} />);

    expect(screen.getByText("aleo.info.transparent.title")).toBeOnTheScreen();
    expect(screen.getByText("aleo.info.private.title")).toBeOnTheScreen();
  });

  it("shows placeholder text for private balance when privateBalance is null (not yet synced)", () => {
    const account: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAleoResources, privateBalance: null },
    };

    render(<AccountBalanceHeader account={account} />);

    expect(screen.getByText("aleo.info.transparent.title")).toBeOnTheScreen();
    expect(screen.getByText("aleo.info.private.title")).toBeOnTheScreen();
    expect(screen.getByText(PRIVATE_BALANCE_PLACEHOLDER)).toBeOnTheScreen();
  });

  it("renders private balance value when privateBalance is zero", () => {
    const account: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAleoResources, privateBalance: new BigNumber(0) },
    };

    render(<AccountBalanceHeader account={account} />);

    expect(screen.getByText("aleo.info.transparent.title")).toBeOnTheScreen();
    expect(screen.getByText("aleo.info.private.title")).toBeOnTheScreen();
    expect(screen.queryByText(PRIVATE_BALANCE_PLACEHOLDER)).not.toBeOnTheScreen();
  });

  it("returns null when aleoResources is missing", () => {
    const account: AleoAccount = {
      ...baseAccount,
      aleoResources: undefined,
    };

    const { toJSON } = render(<AccountBalanceHeader account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("returns null when balance is zero", () => {
    const account: AleoAccount = {
      ...baseAccount,
      balance: new BigNumber(0),
    };

    const { toJSON } = render(<AccountBalanceHeader account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("returns null when balance is negative", () => {
    const account: AleoAccount = {
      ...baseAccount,
      balance: new BigNumber(-1),
    };

    const { toJSON } = render(<AccountBalanceHeader account={account} />);
    expect(toJSON()).toBeNull();
  });
});
