import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import AccountDialogs from "../AccountDialogs";
import {
  XRP_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "../__mocks__/account.mock";
import { xrpMptToken, xrpRlusdToken } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

const iouAccount = makeXrpTokenAccount({
  limit: new BigNumber(1000).shiftedBy(38),
  isRippling: true,
});
const account: Account = {
  ...XRP_ACCOUNT,
  subAccounts: [iouAccount, XRP_MPT_TOKEN_ACCOUNT, XRP_REMOVED_TOKEN_ACCOUNT],
};

const onClose = jest.fn();

function renderDialog(
  dialogAccount: Account | XrpTokenAccount = account,
  params: unknown = { screen: "manageAssets" },
) {
  return render(
    <AccountDialogs
      account={dialogAccount}
      parentAccount={dialogAccount.type === "Account" ? null : account}
      params={params}
      onClose={onClose}
    />,
  );
}

function getCard(tokenId: string) {
  return within(screen.getByTestId(`xrp-manage-assets-card-${tokenId}`));
}

describe("xrp ManageAssetsDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      http.post(XRPL_TESTNET_NODE, () => {
        const node = { LedgerEntryType: "AccountRoot", Flags: 0 };

        return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
      }),
    );
  });

  it("lists the held tokens in the account's order, not the removed one", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Manage assets" })).toBeVisible();
    expect(
      screen.getAllByTestId(/^xrp-manage-assets-card-/).map(card => card.dataset.testid),
    ).toEqual([
      `xrp-manage-assets-card-${xrpRlusdToken.id}`,
      `xrp-manage-assets-card-${xrpMptToken.id}`,
    ]);
  });

  it("shows an IOU with its rows, and Edit and Delete disabled", async () => {
    renderDialog();
    const card = getCard(xrpRlusdToken.id);

    expect(card.getByText("RLUSD")).toBeVisible();
    expect(card.getByText(formatAddress(XRP_ACCOUNT.freshAddress))).toBeVisible();
    expect(card.getByText("Trust Line (IOU)")).toBeVisible();
    expect(await card.findByText("0%")).toBeVisible();
    expect(card.getByText("0.2 XRP")).toBeVisible();
    expect(card.getByText("1,000 RLUSD")).toBeVisible();
    expect(card.getByText("Activated")).toBeVisible();
    expect(card.getByTestId("xrp-manage-assets-edit")).toBeDisabled();
    expect(card.getByTestId("xrp-manage-assets-delete")).toBeDisabled();
  });

  it("shows an MPT without IOU settings, and Delete only, disabled", () => {
    renderDialog();
    const card = getCard(xrpMptToken.id);

    expect(card.getByText("Test MPT")).toBeVisible();
    expect(card.getByText("Multi Purpose Token")).toBeVisible();
    expect(card.getByText("0.2 XRP")).toBeVisible();
    expect(card.queryByText("Balance limit")).not.toBeInTheDocument();
    expect(card.queryByText("Rippling")).not.toBeInTheDocument();
    expect(card.queryByTestId("xrp-manage-assets-edit")).not.toBeInTheDocument();
    expect(card.getByTestId("xrp-manage-assets-delete")).toBeDisabled();
  });

  it("hides a long balance limit in discreet mode", () => {
    const longLimitAccount = makeXrpTokenAccount({ limit: new BigNumber(1).shiftedBy(20 + 38) });
    render(
      <AccountDialogs
        account={{ ...XRP_ACCOUNT, subAccounts: [longLimitAccount] }}
        parentAccount={null}
        params={{ screen: "manageAssets" }}
        onClose={onClose}
      />,
      { initialState: { settings: { discreetMode: true } } },
    );
    const card = getCard(xrpRlusdToken.id);

    expect(card.queryByText("1e20 RLUSD")).not.toBeInTheDocument();
    expect(card.getByText("***")).toBeVisible();
  });

  it("closes on Escape", async () => {
    const { user } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing on a token account page", () => {
    renderDialog(iouAccount);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing for params it does not know", () => {
    renderDialog(account, null);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
