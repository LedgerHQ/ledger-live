import React from "react";
import { HashRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { parseAnyAccountId } from "@domain/entity-account";
import { copyToClipboard } from "@shared/clipboard";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { getAccountUrl } from "~/renderer/utils";
import AccountDetailRoute from "../AccountDetailRoute";

// wallet-btc's compiled secp256k1 import does not resolve under Jest.
jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  SyncOneAccountOnMount: () => null,
}));

jest.mock("@shared/clipboard", () => ({
  ...jest.requireActual("@shared/clipboard"),
  copyToClipboard: jest.fn().mockResolvedValue(true),
}));

const ethAccount = {
  ...genAccount("account-detail-header-eth", {
    currency: getCryptoCurrencyById("ethereum"),
    subAccountsCount: 0,
  }),
  freshAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
};

const otherEthAccount = genAccount("account-detail-header-eth-other", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 0,
});

function LocationProbe() {
  const { pathname } = useLocation();
  return <div data-testid="current-path">{pathname}</div>;
}

function OpenAccountAgain() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(getAccountUrl(ethAccount.id))}>
      Open account again
    </button>
  );
}

function renderFromPreviousPage(accounts: Account[] = [ethAccount], initialRoute = "/") {
  return render(
    <>
      <LocationProbe />
      <OpenAccountAgain />
      <Routes>
        <Route path="/" element={<Link to={getAccountUrl(ethAccount.id)}>Open account</Link>} />
        <Route
          path="/before"
          element={<Link to={getAccountUrl(ethAccount.id)}>Open account</Link>}
        />
        <Route path="/account/:parentId/:id/*" element={<AccountDetailRoute />} />
        <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      </Routes>
    </>,
    {
      initialRoute,
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts,
        syncRefresh: { hasCompletedInitialSync: true, lastUserSyncClickTimestamp: 0 },
        wallet: {
          accountNames: new Map([[parseAnyAccountId(ethAccount.id), "Ethereum 1"]]),
          starredAccountIds: new Set(),
          walletSync: { walletSyncState: { data: null, version: 0 } },
        },
      },
    },
  );
}

function renderFromHashHistory(accounts: Account[] = [ethAccount]) {
  window.history.replaceState(null, "", "#/before");

  return render(
    <HashRouter>
      <LocationProbe />
      <OpenAccountAgain />
      <Routes>
        <Route
          path="/before"
          element={<Link to={getAccountUrl(ethAccount.id)}>Open account</Link>}
        />
        <Route path="/account/:parentId/:id/*" element={<AccountDetailRoute />} />
        <Route path="/account/:id/*" element={<AccountDetailRoute />} />
      </Routes>
    </HashRouter>,
    {
      skipRouter: true,
      initialState: {
        ...withFlagOverrides({ accountDetail: { enabled: true } }),
        accounts,
        syncRefresh: { hasCompletedInitialSync: true, lastUserSyncClickTimestamp: 0 },
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

  it("renames the account from the settings dialog", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByTestId("account-settings-change-name"));

    const dialog = await screen.findByRole("dialog", { name: "Change account name" });
    expect(
      within(dialog).getAllByText(
        /Give this address a name to stay organized \(ex\. ETH-Trading/,
      )[0],
    ).toBeVisible();
    const input = within(dialog).getByRole("textbox", { name: "Address name" });
    expect(input).toHaveValue("Ethereum 1");
    expect(within(dialog).getByRole("button", { name: "Change name" })).toBeDisabled();

    await user.clear(input);
    await user.type(input, "Savings");
    await user.click(within(dialog).getByRole("button", { name: "Change name" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-header-title")).toHaveTextContent("Savings");
  });

  it("renames the account with Enter from the name field", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByTestId("account-settings-change-name"));

    const dialog = await screen.findByRole("dialog", { name: "Change account name" });
    const input = within(dialog).getByRole("textbox", { name: "Address name" });
    await user.clear(input);
    await user.type(input, "Savings{Enter}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-header-title")).toHaveTextContent("Savings");
  });

  it("shows and copies the advanced logs from the settings dialog", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByText("View advanced logs"));

    const dialog = await screen.findByRole("dialog", { name: "Advanced logs" });
    expect(within(dialog).getByText(/^Synchronised /)).toBeVisible();
    const logs = within(dialog).getByTestId("account-settings-advanced-logs-json").textContent;
    expect(JSON.parse(logs ?? "")).toEqual({
      index: ethAccount.index,
      freshAddressPath: ethAccount.freshAddressPath,
      id: ethAccount.id,
      blockHeight: ethAccount.blockHeight,
      ...(ethAccount.xpub ? { xpub: ethAccount.xpub } : {}),
    });

    await user.click(within(dialog).getByRole("button", { name: "Copy logs" }));

    expect(copyToClipboard).toHaveBeenCalledWith(logs);
    expect(await within(dialog).findByRole("button", { name: "Copied" })).toBeVisible();
  });

  it("keeps the account and closes the dialog", async () => {
    const { user, store } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByText("Remove account from portfolio"));

    await user.click(screen.getByRole("button", { name: "Keep" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("account-detail-layout")).toBeVisible();
    expect(store.getState().accounts.map(account => account.id)).toContain(ethAccount.id);
  });

  it("removes the account and returns to the previous page", async () => {
    const { user, store } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByText("Remove account from portfolio"));

    await user.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(screen.getByTestId("current-path").textContent).toBe("/");
    expect(screen.queryByTestId("account-detail-layout")).not.toBeInTheDocument();
    expect(store.getState().accounts.map(account => account.id)).not.toContain(ethAccount.id);
  });

  it("removes the account when the previous history entry is the same account", async () => {
    const { user, store } = renderFromPreviousPage([ethAccount], "/before");
    await user.click(screen.getByText("Open account"));
    await user.click(screen.getByRole("button", { name: "Open account again" }));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByText("Remove account from portfolio"));

    await user.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(screen.getByTestId("current-path").textContent).toBe("/before");
    expect(screen.queryByTestId("account-detail-layout")).not.toBeInTheDocument();
    expect(store.getState().accounts.map(account => account.id)).not.toContain(ethAccount.id);
  });

  it("removes the account from duplicate HashRouter entries", async () => {
    const { user, store } = renderFromHashHistory();
    await user.click(screen.getByText("Open account"));
    await user.click(screen.getByRole("button", { name: "Open account again" }));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByText("Remove account from portfolio"));

    await user.click(screen.getByRole("button", { name: "Yes, remove" }));

    await screen.findByText("Open account");
    expect(screen.getByTestId("current-path")).toHaveTextContent("/before");
    expect(store.getState().accounts.map(account => account.id)).not.toContain(ethAccount.id);
  });

  it("returns to the previous page when another account of that crypto remains", async () => {
    const { user, store } = renderFromPreviousPage([ethAccount, otherEthAccount]);
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByText("Remove account from portfolio"));

    await user.click(screen.getByRole("button", { name: "Yes, remove" }));

    expect(screen.getByTestId("current-path").textContent).toBe("/");
    expect(screen.queryByTestId("account-detail-layout")).not.toBeInTheDocument();
    expect(store.getState().accounts.map(account => account.id)).toEqual([otherEthAccount.id]);
  });

  it("goes back to the settings menu from the change name step", async () => {
    const { user } = renderFromPreviousPage();
    await user.click(screen.getByText("Open account"));
    await user.click(await screen.findByRole("button", { name: "Account settings" }));
    await user.click(await screen.findByTestId("account-settings-change-name"));

    await user.click(await screen.findByRole("button", { name: /back/i }));

    expect(await screen.findByTestId("account-settings-menu")).toBeVisible();
  });
});
