import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import type { Account, Operation } from "@ledgerhq/types-live";
import {
  getIssuerFeeForToken,
  getNetworkReservesForCurrency,
} from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
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

// coin-xrp caches server_info and issuer roots: a test fails the fetch here, not on the node
jest.mock("@ledgerhq/live-common/families/xrp/logicPublic", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/families/xrp/logicPublic");

  return {
    ...actual,
    getIssuerFeeForToken: jest.fn(actual.getIssuerFeeForToken),
    getNetworkReservesForCurrency: jest.fn(actual.getNetworkReservesForCurrency),
  };
});

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
        const info = { validated_ledger: { reserve_base_xrp: 1, reserve_inc_xrp: 0.3 } };

        return HttpResponse.json({ result: { node, account_data: node, info, status: "success" } });
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

  it("shows an IOU with its rows, Edit and Delete enabled", async () => {
    renderDialog();
    const card = getCard(xrpRlusdToken.id);

    expect(card.getByText("RLUSD")).toBeVisible();
    expect(card.getByText(formatAddress(XRP_ACCOUNT.freshAddress))).toBeVisible();
    expect(card.getByText("Trust Line (IOU)")).toBeVisible();
    expect(await card.findByText("0%")).toBeVisible();
    expect(await card.findByText("0.3 XRP")).toBeVisible();
    expect(card.getByText("1,000 RLUSD")).toBeVisible();
    expect(card.getByText("Activated")).toBeVisible();
    expect(card.getByTestId("xrp-manage-assets-edit")).toBeEnabled();
    expect(card.getByTestId("xrp-manage-assets-delete")).toBeEnabled();
  });

  it("keeps Edit enabled on a frozen IOU", () => {
    const frozenAccount = makeXrpTokenAccount({ limit: new BigNumber(1), isLocked: true });
    renderDialog({ ...XRP_ACCOUNT, subAccounts: [frozenAccount] });

    expect(getCard(xrpRlusdToken.id).getByTestId("xrp-manage-assets-edit")).toBeEnabled();
  });

  it("opens Edit details of the IOU, and goes back to the list", async () => {
    const { user } = renderDialog();

    await user.click(getCard(xrpRlusdToken.id).getByTestId("xrp-manage-assets-edit"));

    expect(screen.getByRole("dialog", { name: "Edit details" })).toBeVisible();
    expect(screen.getByTestId("xrp-trust-limit-row")).toHaveTextContent("1,000 RLUSD");
    expect(screen.getByTestId("xrp-trust-rippling-row")).toHaveTextContent("Activated");

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByRole("dialog", { name: "Manage assets" })).toBeVisible();
  });

  it("keeps Edit details in step with the synced token", async () => {
    const { user, rerender } = renderDialog();
    await user.click(getCard(xrpRlusdToken.id).getByTestId("xrp-manage-assets-edit"));
    expect(screen.queryByText("Your limit is 0: you can't receive this token.")).toBeNull();

    const syncedAccount: Account = {
      ...account,
      subAccounts: [makeXrpTokenAccount({ limit: new BigNumber(0), isRippling: true })],
    };
    rerender(
      <AccountDialogs
        account={syncedAccount}
        parentAccount={null}
        params={{ screen: "manageAssets" }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Your limit is 0: you can't receive this token.")).toBeVisible();
  });

  it("shows an MPT without IOU settings, and Delete only", async () => {
    renderDialog();
    const card = getCard(xrpMptToken.id);

    expect(card.getByText("Test MPT")).toBeVisible();
    expect(card.getByText("Multi Purpose Token")).toBeVisible();
    expect(await card.findByText("0.3 XRP")).toBeVisible();
    expect(card.queryByText("Balance limit")).not.toBeInTheDocument();
    expect(card.queryByText("Rippling")).not.toBeInTheDocument();
    expect(card.queryByTestId("xrp-manage-assets-edit")).not.toBeInTheDocument();
    expect(card.getByTestId("xrp-manage-assets-delete")).toBeEnabled();
  });

  it("disables Delete while a removal of the token is pending, and says why on hover", async () => {
    const pendingRemoval = {
      type: "OPT_OUT",
      transactionRaw: {
        assetReference: xrpRlusdToken.tokenIdentifier,
        assetOwner: xrpRlusdToken.contractAddress,
      },
    } as unknown as Operation;
    const { user } = renderDialog({ ...account, pendingOperations: [pendingRemoval] });
    const deleteButton = getCard(xrpRlusdToken.id).getByTestId("xrp-manage-assets-delete");

    expect(deleteButton).toBeDisabled();
    expect(getCard(xrpMptToken.id).getByTestId("xrp-manage-assets-delete")).toBeEnabled();

    await user.hover(deleteButton.parentElement!);

    expect(await screen.findByRole("tooltip", { name: "Removal pending" })).toBeInTheDocument();
  });

  it("disables Delete on a frozen token, and says why on hover", async () => {
    const frozenAccount = makeXrpTokenAccount({ limit: new BigNumber(1), isLocked: true });
    const { user } = renderDialog({ ...XRP_ACCOUNT, subAccounts: [frozenAccount] });
    const deleteButton = getCard(xrpRlusdToken.id).getByTestId("xrp-manage-assets-delete");

    expect(deleteButton).toBeDisabled();

    await user.hover(deleteButton.parentElement!);

    expect(
      await screen.findByRole("tooltip", { name: "This token is frozen" }),
    ).toBeInTheDocument();
  });

  it("opens Delete of an empty token, and its close button closes the dialog", async () => {
    const emptyMptAccount = { ...XRP_MPT_TOKEN_ACCOUNT, balance: new BigNumber(0) };
    const { user } = renderDialog({ ...XRP_ACCOUNT, subAccounts: [emptyMptAccount] });

    await user.click(getCard(xrpMptToken.id).getByTestId("xrp-manage-assets-delete"));

    expect(screen.getByText("Are you sure you want to delete TMPT?")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("goes back to the list from the balance screen's Got it", async () => {
    const heldMptAccount = { ...XRP_MPT_TOKEN_ACCOUNT, balance: new BigNumber(5) };
    const { user } = renderDialog({ ...XRP_ACCOUNT, subAccounts: [heldMptAccount] });

    await user.click(getCard(xrpMptToken.id).getByTestId("xrp-manage-assets-delete"));
    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.getByRole("dialog", { name: "Manage assets" })).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the Delete screen once a sync drops the token account", async () => {
    const heldMptAccount = { ...XRP_MPT_TOKEN_ACCOUNT, balance: new BigNumber(5) };
    const { user, rerender } = renderDialog({ ...XRP_ACCOUNT, subAccounts: [heldMptAccount] });
    await user.click(getCard(xrpMptToken.id).getByTestId("xrp-manage-assets-delete"));

    rerender(
      <AccountDialogs
        account={{ ...XRP_ACCOUNT, subAccounts: [] }}
        parentAccount={null}
        params={{ screen: "manageAssets" }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Empty your TMPT balance to remove it")).toBeVisible();
  });

  it("shows a skeleton until the transfer fee loads", async () => {
    renderDialog();
    const card = getCard(xrpRlusdToken.id);

    expect(card.getByTestId("xrp-manage-assets-transfer-fee-loading")).toBeInTheDocument();
    expect(await card.findByText("0%")).toBeVisible();
    expect(card.queryByTestId("xrp-manage-assets-transfer-fee-loading")).not.toBeInTheDocument();
  });

  it("shows a skeleton until the locked amount loads", async () => {
    renderDialog();
    const card = getCard(xrpRlusdToken.id);

    expect(card.getByTestId("xrp-manage-assets-locked-amount-loading")).toBeInTheDocument();
    expect(await card.findByText("0.3 XRP")).toBeVisible();
    expect(card.queryByTestId("xrp-manage-assets-locked-amount-loading")).not.toBeInTheDocument();
  });

  it("shows an error for the locked amount when the reserves can't be fetched", async () => {
    jest.mocked(getNetworkReservesForCurrency).mockRejectedValueOnce(new Error("timeout"));
    renderDialog();
    const card = getCard(xrpRlusdToken.id);

    expect(await card.findByText("Couldn't load")).toBeVisible();
  });

  it("shows an error for the transfer fee when it can't be fetched", async () => {
    jest.mocked(getIssuerFeeForToken).mockRejectedValueOnce(new Error("timeout"));
    renderDialog({ ...XRP_ACCOUNT, subAccounts: [iouAccount] });
    const card = getCard(xrpRlusdToken.id);

    expect(await card.findByText("Couldn't load")).toBeVisible();
    expect(await card.findByText("0.3 XRP")).toBeVisible();
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

  it("stays open while the device is busy", async () => {
    const { user } = renderDialog();
    render(<DeviceBlocker />);

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).not.toHaveBeenCalled();
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
