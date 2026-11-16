import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { render, screen } from "@tests/test-renderer";
import SubAccountsList from "../SubAccountsList";
import { XRP_ACCOUNT, XRP_ACCOUNT_WITH_TOKEN } from "~/families/xrp/__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);

const STELLAR_ACCOUNT: Account = {
  ...genAccount("stellar-1", { currency: getCryptoCurrencyById("stellar") }),
  subAccounts: [],
};
const ETHEREUM_ACCOUNT: Account = {
  ...genAccount("ethereum-1", { currency: getCryptoCurrencyById("ethereum") }),
  subAccounts: [],
};

const ADD_TOKEN_BUTTON = "xrp-add-token-button";

function renderList(parentAccount: Account) {
  return render(
    <SubAccountsList
      parentAccount={parentAccount}
      accountId={parentAccount.id}
      onAccountPress={jest.fn()}
    />,
  );
}

describe("SubAccountsList", () => {
  beforeEach(() => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou"]);
  });

  it("renders nothing for an XRP account without tokens when every standard is off", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    renderList(XRP_ACCOUNT);

    expect(screen.queryByTestId(ADD_TOKEN_BUTTON)).toBeNull();
    expect(screen.queryByText(/Tokens/)).toBeNull();
  });

  it("offers to add a token to an XRP account without tokens", () => {
    renderList(XRP_ACCOUNT);

    expect(screen.getByText("You can add tokens to your XRP account.")).toBeVisible();
    expect(screen.getByTestId(ADD_TOKEN_BUTTON)).toBeVisible();
  });

  it("offers to add a token next to the held tokens of an XRP account", () => {
    renderList(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.getByText("Tokens (1)")).toBeVisible();
    expect(screen.getByTestId(ADD_TOKEN_BUTTON)).toBeVisible();
  });

  it("keeps the sub-account wording and no add-token action when every standard is off", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);
    renderList(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.queryByText("Tokens (1)")).toBeNull();
    expect(screen.queryByTestId(ADD_TOKEN_BUTTON)).toBeNull();
  });

  it("keeps the Stellar empty state", () => {
    renderList(STELLAR_ACCOUNT);

    expect(screen.getByText("You can add assets to your Stellar account.")).toBeVisible();
    expect(screen.queryByTestId(ADD_TOKEN_BUTTON)).toBeNull();
  });

  it("keeps the generic token empty state of a currency with static token types", () => {
    renderList(ETHEREUM_ACCOUNT);

    expect(screen.getByText(/To add token accounts, you need to/)).toBeVisible();
    expect(screen.queryByTestId(ADD_TOKEN_BUTTON)).toBeNull();
  });
});
