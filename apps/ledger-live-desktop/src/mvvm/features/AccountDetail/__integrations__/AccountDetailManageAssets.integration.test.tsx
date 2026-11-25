import React from "react";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import type { Account } from "@ledgerhq/types-live";
import { render, screen, waitFor } from "tests/testSetup";
import { importLLDCoinFamily } from "~/renderer/families";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import {
  XRP_ACCOUNT,
  XRP_ACCOUNT_WITH_TOKEN,
} from "~/renderer/families/xrp/__mocks__/account.mock";
import { Header } from "../components/Header";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

const mockedGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);

async function openSettings(account: Account) {
  const rendered = render(<Header account={account} />);

  const settingsButton = await screen.findByRole("button", { name: "Account settings" });
  await rendered.user.click(settingsButton);
  const changeNameItem = await screen.findByTestId("account-settings-change-name");
  expect(changeNameItem).toBeVisible();

  return rendered;
}

beforeAll(async () => {
  await Promise.all(["xrp", "evm"].map(family => importLLDCoinFamily(family)));
});

beforeEach(() => {
  mockedGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
});

describe("Account Detail settings: Manage assets", () => {
  it("opens Manage assets of an XRP account that holds tokens, and closes the settings", async () => {
    const rendered = await openSettings(XRP_ACCOUNT_WITH_TOKEN);

    await rendered.user.click(screen.getByTestId("account-settings-manage-assets"));

    await waitFor(() => {
      expect(screen.queryByTestId("account-detail-settings-dialog")).not.toBeInTheDocument();
    });
    expect(rendered.store.getState().dialogsWithData.FAMILY_DIALOG).toEqual({
      isOpen: true,
      data: { accountId: XRP_ACCOUNT_WITH_TOKEN.id, params: { screen: "manageAssets" } },
    });
  });

  it("hides Manage assets on an XRP account without tokens", async () => {
    await openSettings(XRP_ACCOUNT);

    expect(screen.queryByTestId("account-settings-manage-assets")).not.toBeInTheDocument();
  });

  it("hides Manage assets when no XRP token standard is enabled", async () => {
    mockedGetXrpEnabledTokenStandards.mockReturnValue([]);

    await openSettings(XRP_ACCOUNT_WITH_TOKEN);

    expect(screen.queryByTestId("account-settings-manage-assets")).not.toBeInTheDocument();
  });

  it("hides Manage assets on an account of another family", async () => {
    await openSettings(ETH_ACCOUNT);

    expect(screen.queryByTestId("account-settings-manage-assets")).not.toBeInTheDocument();
  });
});
