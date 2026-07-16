import React from "react";
import { render, screen } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import type { AleoAccount, AleoTokenAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT_1 } from "../__mocks__/account.mock";
import AccountBalanceHeader from "../AccountBalanceHeader";
import { PRIVATE_BALANCE_PLACEHOLDER } from "@ledgerhq/live-common/families/aleo/constants";
import { useAleoPrivateSync } from "../hooks/useAleoPrivateSync";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../hooks/useAleoPrivateSync");

jest.mocked(useAleoPrivateSync).mockReturnValue({
  isSyncing: false,
  progress: 0,
  error: null,
  start: jest.fn(),
  stop: jest.fn(),
});

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

  it("shows the private sync button for a regular account", () => {
    render(<AccountBalanceHeader account={baseAccount} />);

    expect(screen.getByTestId("start-private-sync-button")).toBeOnTheScreen();
  });

  describe("token account", () => {
    const tokenAccount: AleoTokenAccount = {
      ...(ALEO_TOKEN_ACCOUNT_1 as AleoTokenAccount),
      balance: new BigNumber(1000000),
      transparentBalance: new BigNumber(600000),
      privateBalance: new BigNumber(400000),
      unspentPrivateRecords: null,
    };

    it("renders balances from the token account's own fields", () => {
      render(<AccountBalanceHeader account={tokenAccount} parentAccount={baseAccount} />);

      expect(screen.getByText("aleo.balancesSection")).toBeOnTheScreen();
      expect(screen.getByText("aleo.info.transparent.title")).toBeOnTheScreen();
      expect(screen.getByText("aleo.info.private.title")).toBeOnTheScreen();
    });

    it("hides the private sync button", () => {
      render(<AccountBalanceHeader account={tokenAccount} parentAccount={baseAccount} />);

      expect(screen.queryByTestId("start-private-sync-button")).not.toBeOnTheScreen();
    });

    it("shows placeholder text when the token's privateBalance is null (not yet synced)", () => {
      const account: AleoTokenAccount = { ...tokenAccount, privateBalance: null };

      render(<AccountBalanceHeader account={account} parentAccount={baseAccount} />);

      expect(screen.getByText(PRIVATE_BALANCE_PLACEHOLDER)).toBeOnTheScreen();
    });

    it("returns null when the token account has no transparentBalance yet", () => {
      const account = {
        ...tokenAccount,
        transparentBalance: undefined,
      } as unknown as AleoTokenAccount;

      const { toJSON } = render(
        <AccountBalanceHeader account={account} parentAccount={baseAccount} />,
      );
      expect(toJSON()).toBeNull();
    });

    it("returns null when the token's balance is zero", () => {
      const account: AleoTokenAccount = { ...tokenAccount, balance: new BigNumber(0) };

      const { toJSON } = render(
        <AccountBalanceHeader account={account} parentAccount={baseAccount} />,
      );
      expect(toJSON()).toBeNull();
    });

    it("returns null instead of throwing when parentAccount is missing", () => {
      const { toJSON } = render(<AccountBalanceHeader account={tokenAccount} />);
      expect(toJSON()).toBeNull();
    });
  });
});
