import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, render, screen } from "tests/testSetup";
import { removeAccount } from "~/renderer/actions/accounts";
import FamilyDialogs from "../index";
import { openFamilyDialog } from "../familyDialogs";

type FakeDialogProps = Readonly<{
  account: AccountLike;
  parentAccount: AccountLike | null | undefined;
  params: unknown;
  onClose: () => void;
}>;

function mockXrpDialog({ account, parentAccount, params, onClose }: FakeDialogProps) {
  return (
    <div role="dialog" aria-label="XRP dialog">
      <span data-testid="account">{account.id}</span>
      <span data-testid="parent-account">{parentAccount?.id}</span>
      <span data-testid="params">{JSON.stringify(params)}</span>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

jest.mock("~/renderer/families", () => ({
  useLLDCoinFamily: (family?: string) => (family === "xrp" ? { AccountDialog: mockXrpDialog } : {}),
}));

const XRP = getCryptoCurrencyById("ripple");
const RLUSD: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse("ripple/iou/rlusd"),
  parentCurrencyId: XRP.id,
  contractAddress: "rIssuer",
  tokenIdentifier: "524C555344000000000000000000000000000000",
  tokenType: "iou",
  name: "RLUSD",
  ticker: "RLUSD",
  units: [{ name: "RLUSD", code: "RLUSD", magnitude: 0 }],
};
const XRP_ACCOUNT = genAccount("xrp-1", { currency: XRP });
const XRP_TOKEN_ACCOUNT = genTokenAccount(0, XRP_ACCOUNT, RLUSD);
const XRP_ACCOUNT_WITH_TOKEN = { ...XRP_ACCOUNT, subAccounts: [XRP_TOKEN_ACCOUNT] };
const BITCOIN_ACCOUNT = genAccount("btc-1", { currency: getCryptoCurrencyById("bitcoin") });

function renderFamilyDialogs() {
  return render(<FamilyDialogs />, {
    initialState: { accounts: [XRP_ACCOUNT_WITH_TOKEN, BITCOIN_ACCOUNT] },
  });
}

describe("FamilyDialogs", () => {
  it("opens the family's dialog with the account and params, and closes it", async () => {
    const { store, user } = renderFamilyDialogs();

    act(() => {
      store.dispatch(openFamilyDialog(XRP_ACCOUNT.id, { screen: "manageAssets" }));
    });

    expect(screen.getByRole("dialog", { name: "XRP dialog" })).toBeVisible();
    expect(screen.getByTestId("account")).toHaveTextContent(XRP_ACCOUNT.id);
    expect(screen.getByTestId("params")).toHaveTextContent('{"screen":"manageAssets"}');

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(store.getState().dialogsWithData.FAMILY_DIALOG).toEqual({ isOpen: false, data: null });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the parent account's family dialog for a token account", () => {
    const { store } = renderFamilyDialogs();

    act(() => {
      store.dispatch(openFamilyDialog(XRP_TOKEN_ACCOUNT.id, null));
    });

    expect(screen.getByTestId("account")).toHaveTextContent(XRP_TOKEN_ACCOUNT.id);
    expect(screen.getByTestId("parent-account")).toHaveTextContent(XRP_ACCOUNT.id);
  });

  it("closes when its account is removed", () => {
    const { store } = renderFamilyDialogs();

    act(() => {
      store.dispatch(openFamilyDialog(XRP_ACCOUNT.id, null));
    });
    act(() => {
      store.dispatch(removeAccount(XRP_ACCOUNT_WITH_TOKEN));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().dialogsWithData.FAMILY_DIALOG).toEqual({ isOpen: false, data: null });
  });

  it("closes for a family without a dialog", () => {
    const { store } = renderFamilyDialogs();

    act(() => {
      store.dispatch(openFamilyDialog(BITCOIN_ACCOUNT.id, null));
    });

    expect(store.getState().dialogsWithData.FAMILY_DIALOG).toEqual({ isOpen: false, data: null });
  });

  it("shows nothing for a family without a dialog", () => {
    const { store } = renderFamilyDialogs();

    act(() => {
      store.dispatch(openFamilyDialog(BITCOIN_ACCOUNT.id, null));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows nothing for an unknown account", () => {
    const { store } = renderFamilyDialogs();

    act(() => {
      store.dispatch(openFamilyDialog("unknown-account", null));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
