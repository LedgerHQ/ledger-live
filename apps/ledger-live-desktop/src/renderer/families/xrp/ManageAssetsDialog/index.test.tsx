import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "tests/testSetup";
import { HttpResponse, http, server } from "tests/server";
import type { Account } from "@ledgerhq/types-live";
import ManageAssetsDialog from "./index";
import {
  XRP_ACCOUNT,
  XRP_MPT_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
  makeXrpTokenAccount,
} from "../__mocks__/account.mock";
import { xrpMptToken, xrpRlusdToken } from "../__mocks__/currency.mock";

const XRPL_TESTNET_NODE = "https://s.altnet.rippletest.net:51234";

type StepProps = { tokenAccount: { id: string }; onBackToList: () => void };

function mockStepScreen(testId: string) {
  return (props: StepProps) => (
    <div data-testid={testId}>
      {props.tokenAccount.id}
      <button onClick={props.onBackToList}>Back to list</button>
    </div>
  );
}

jest.mock("./DeleteAsset", () => ({ DeleteAsset: mockStepScreen("xrp-delete-asset") }));
jest.mock("./EditAsset", () => ({ EditAsset: mockStepScreen("xrp-edit-asset") }));

const iouAccount = makeXrpTokenAccount({
  limit: new BigNumber(1000).shiftedBy(38),
  isRippling: true,
});
const account: Account = {
  ...XRP_ACCOUNT,
  subAccounts: [iouAccount, XRP_MPT_TOKEN_ACCOUNT, XRP_REMOVED_TOKEN_ACCOUNT],
};

function renderDialog(dialogAccount: Account = account, isOpen = true) {
  return render(<ManageAssetsDialog account={dialogAccount} parentAccount={null} />, {
    initialState: { dialogs: { XRP_MANAGE_ASSETS: isOpen } },
  });
}

function getCard(tokenId: string) {
  return screen.getByTestId(`xrp-manage-assets-card-${tokenId}`);
}

describe("xrp ManageAssetsDialog", () => {
  beforeEach(() => {
    server.use(
      http.post(XRPL_TESTNET_NODE, () => {
        const node = { LedgerEntryType: "AccountRoot", Flags: 0 };

        return HttpResponse.json({ result: { node, account_data: node, status: "success" } });
      }),
    );
  });

  it("shows nothing while closed", () => {
    renderDialog(account, false);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when the account page unmounts, so the next account page opens without it", () => {
    const { store, unmount } = renderDialog();

    unmount();

    expect(store.getState().dialogs.XRP_MANAGE_ASSETS).toBe(false);
  });

  it("lists the held tokens, not the removed one", () => {
    renderDialog();

    expect(screen.getByRole("dialog", { name: "Manage assets" })).toBeVisible();
    expect(screen.getAllByTestId(/^xrp-manage-assets-card-/)).toHaveLength(2);
  });

  it("shows an IOU with its settings, Edit and Delete", () => {
    renderDialog();
    const card = within(getCard(xrpRlusdToken.id));

    expect(card.getByText("Trust Line (IOU)")).toBeVisible();
    expect(card.getAllByText("r9fn...Cek4")).toHaveLength(2);
    expect(card.getByText("1,000 RLUSD")).toBeVisible();
    expect(card.getByText("Activated")).toBeVisible();
    expect(card.getByTestId("xrp-manage-assets-edit")).toBeEnabled();
    expect(card.getByTestId("xrp-manage-assets-delete")).toBeEnabled();
  });

  it("shows an MPT with Delete only", () => {
    renderDialog();
    const card = within(getCard(xrpMptToken.id));

    expect(card.getByText("Multi Purpose Token")).toBeVisible();
    expect(card.queryByText("Balance limit")).not.toBeInTheDocument();
    expect(card.queryByText("Rippling")).not.toBeInTheDocument();
    expect(card.queryByTestId("xrp-manage-assets-edit")).not.toBeInTheDocument();
    expect(card.getByTestId("xrp-manage-assets-delete")).toBeEnabled();
  });

  it("Edit opens the edit steps for that token", async () => {
    const { user } = renderDialog();

    await user.click(within(getCard(xrpRlusdToken.id)).getByTestId("xrp-manage-assets-edit"));

    expect(screen.getByTestId("xrp-edit-asset")).toHaveTextContent(iouAccount.id);
    expect(screen.queryByTestId(/^xrp-manage-assets-card-/)).not.toBeInTheDocument();
  });

  it("Delete opens the delete steps for that token, and they can go back to the list", async () => {
    const { user } = renderDialog();

    await user.click(within(getCard(xrpMptToken.id)).getByTestId("xrp-manage-assets-delete"));

    expect(screen.getByTestId("xrp-delete-asset")).toHaveTextContent(XRP_MPT_TOKEN_ACCOUNT.id);
    expect(screen.queryByTestId(/^xrp-manage-assets-card-/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to list" }));

    expect(screen.getAllByTestId(/^xrp-manage-assets-card-/)).toHaveLength(2);
  });

  it("disables Delete on a frozen token", () => {
    const frozenIouAccount = makeXrpTokenAccount({ isLocked: true });
    renderDialog({ ...XRP_ACCOUNT, subAccounts: [frozenIouAccount] });

    expect(screen.getByTestId("xrp-manage-assets-delete")).toBeDisabled();
    expect(screen.getByTestId("xrp-manage-assets-edit")).toBeEnabled();
  });

  it("closes on Escape", async () => {
    const { user, store } = renderDialog();

    await user.keyboard("{Escape}");

    expect(store.getState().dialogs.XRP_MANAGE_ASSETS).toBe(false);
  });

  it("renders nothing on a token account page", () => {
    render(<ManageAssetsDialog account={iouAccount} parentAccount={account} />, {
      initialState: { dialogs: { XRP_MANAGE_ASSETS: true } },
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
