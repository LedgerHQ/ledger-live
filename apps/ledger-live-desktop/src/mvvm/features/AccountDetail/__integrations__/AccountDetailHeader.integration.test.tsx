import React from "react";
import { Link, Route, Routes } from "react-router";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseAnyAccountId } from "@domain/entity-account";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  SyncOneAccountOnMount: () => null,
}));

const ethAccount = {
  ...genAccount("account-detail-header-eth", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  }),
  freshAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
};

function renderFromPreviousPage() {
  return render(
    <Routes>
      <Route path="/" element={<Link to={getAccountUrl(ethAccount.id)}>Open account</Link>} />
      <Route path="/account/:parentId/:id/*" element={<AccountDetailRoute />} />
      <Route path="/account/:id/*" element={<AccountDetailRoute />} />
    </Routes>,
    {
      initialRoute: "/",
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts: [ethAccount],
        wallet: {
          accountNames: new Map([[parseAnyAccountId(ethAccount.id), "Ethereum 1"]]),
          starredAccountIds: new Set(),
          walletSync: { walletSyncState: { data: null, version: 0 } },
        },
      },
    },
  );
}

describe("AccountDetail header", () => {
  it("shows the account name, the shortened address and the settings button", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));

    expect(await screen.findByTestId("page-header-title")).toHaveTextContent("Ethereum 1");
    expect(screen.getByTestId("account-detail-header-address")).toHaveTextContent("0x71...976F");
    expect(screen.getByRole("button", { name: "Account settings" })).toBeVisible();
  });

  it("goes back to the previous page", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(await screen.findByText("Open account")).toBeVisible();
    expect(screen.queryByTestId("account-detail-layout")).not.toBeInTheDocument();
  });

  it("opens the account settings from the settings button", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    expect(await screen.findByTestId("account-detail-layout")).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Account settings" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ethereum 1")).toBeVisible();
    expect(within(dialog).getByText("Remove account from portfolio")).toBeVisible();
  });

  it("keeps the dialog name on the remove confirmation", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));

    await user.click(await screen.findByText("Remove account from portfolio"));

    const dialog = await screen.findByRole("dialog", { name: "Account settings" });
    expect(within(dialog).getByText("Remove account?")).toBeVisible();
  });
});
