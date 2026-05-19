import React from "react";
import {
  genAccount,
  genTokenAccount,
} from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { setSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { render, screen } from "@tests/test-renderer";
import LoadingFooter from "~/components/LoadingFooter";
import { OperationsList } from "../OperationsList";

jest.mock("~/screens/Portfolio/EmptyStatePortfolio", () => {
  const { View } = jest.requireActual("react-native");
  return function MockEmptyStatePortfolio() {
    return <View testID="empty-state-portfolio" />;
  };
});

jest.mock("~/screens/Portfolio/NoOpStatePortfolio", () => {
  const { View } = jest.requireActual("react-native");
  return function MockNoOpStatePortfolio() {
    return <View testID="no-op-state-portfolio" />;
  };
});

setSupportedCurrencies(["ethereum"]);

const ethereum = getCryptoCurrencyById("ethereum");
const usdc = { parentCurrency: { family: "evm" } } as TokenCurrency;

const EMPTY_PARENT = genAccount("opslist-parent-empty", {
  currency: ethereum,
  operationsSize: 0,
  subAccountsCount: 0,
});
const FUNDED_PARENT = genAccount("opslist-parent-funded", {
  currency: ethereum,
  operationsSize: 5,
  subAccountsCount: 0,
});
const emptyTokenOf = (parent: typeof EMPTY_PARENT): TokenAccount => ({
  ...genTokenAccount(0, parent, usdc),
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operations: [],
  operationsCount: 0,
});

const EMPTY_PARENT_TOKEN = emptyTokenOf(EMPTY_PARENT);
const FUNDED_PARENT_TOKEN: TokenAccount = genTokenAccount(0, FUNDED_PARENT, usdc);

function renderList(props: {
  accountsFiltered: AccountLike[];
  allAccounts: typeof EMPTY_PARENT[];
}) {
  return render(
    <OperationsList
      accountsFiltered={props.accountsFiltered}
      allAccounts={props.allAccounts}
      sections={[]}
      completed={true}
    />,
  );
}

describe("OperationsList — empty / no-op state", () => {
  it("renders EmptyStatePortfolio when accountsFiltered is empty", () => {
    renderList({ accountsFiltered: [], allAccounts: [] });

    expect(screen.queryByTestId("empty-state-portfolio")).not.toBeNull();
    expect(screen.queryByTestId("no-op-state-portfolio")).toBeNull();
  });

  it("renders NoOpStatePortfolio when filtered TokenAccounts' parent bridge reports empty (regression for token-only filter)", () => {
    renderList({ accountsFiltered: [EMPTY_PARENT_TOKEN], allAccounts: [EMPTY_PARENT] });

    expect(screen.queryByTestId("no-op-state-portfolio")).not.toBeNull();
    expect(screen.queryByTestId("empty-state-portfolio")).toBeNull();
  });

  it("does not render NoOpStatePortfolio when at least one bridge reports non-empty", () => {
    renderList({
      accountsFiltered: [FUNDED_PARENT, FUNDED_PARENT_TOKEN],
      allAccounts: [FUNDED_PARENT],
    });

    expect(screen.queryByTestId("no-op-state-portfolio")).toBeNull();
    expect(screen.queryByTestId("empty-state-portfolio")).toBeNull();
  });

  it("falls back to non-empty (no NoOpState) when parent Account is missing from allAccounts", () => {
    renderList({ accountsFiltered: [EMPTY_PARENT_TOKEN], allAccounts: [] });

    expect(screen.queryByTestId("no-op-state-portfolio")).toBeNull();
    expect(screen.queryByTestId("empty-state-portfolio")).toBeNull();
  });

  it("renders NoOpStatePortfolio for a plain Account in accountsFiltered when its bridge reports empty", () => {
    renderList({ accountsFiltered: [EMPTY_PARENT], allAccounts: [EMPTY_PARENT] });

    expect(screen.queryByTestId("no-op-state-portfolio")).not.toBeNull();
  });

  it("renders the loading footer when not yet completed and onEndReached is set", () => {
    render(
      <OperationsList
        accountsFiltered={[FUNDED_PARENT]}
        allAccounts={[FUNDED_PARENT]}
        sections={[]}
        completed={false}
        onEndReached={() => {}}
      />,
    );

    expect(screen.UNSAFE_queryByType(LoadingFooter)).not.toBeNull();
  });
});
