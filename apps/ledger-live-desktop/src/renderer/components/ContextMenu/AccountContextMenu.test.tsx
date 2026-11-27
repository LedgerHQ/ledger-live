import React from "react";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { fireEvent, render, screen } from "tests/testSetup";
import { importLLDCoinFamily } from "~/renderer/families";
import { XRP_ACCOUNT, makeXrpTokenAccount } from "~/renderer/families/xrp/__mocks__/account.mock";
import AccountContextMenu from "./AccountContextMenu";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));

const openTokenMenu = async (token: XrpTokenAccount) => {
  render(
    <AccountContextMenu account={token} parentAccount={XRP_ACCOUNT}>
      <div>token row</div>
    </AccountContextMenu>,
  );
  fireEvent.contextMenu(await screen.findByText("token row"));
  await screen.findByText("Hide token");
};

beforeAll(async () => {
  await importLLDCoinFamily("xrp");
});

describe("AccountContextMenu", () => {
  it("leaves Send and Receive out for a frozen XRP token", async () => {
    await openTokenMenu(makeXrpTokenAccount({ isLocked: true }));

    expect(screen.queryByText("Send")).not.toBeInTheDocument();
    expect(screen.queryByText("Receive")).not.toBeInTheDocument();
  });

  it("offers Send and Receive for an unfrozen XRP token", async () => {
    await openTokenMenu(makeXrpTokenAccount());

    expect(screen.getByText("Send")).toBeVisible();
    expect(screen.getByText("Receive")).toBeVisible();
  });
});
