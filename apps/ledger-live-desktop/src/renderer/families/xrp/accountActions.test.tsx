import React from "react";
import { render, screen } from "tests/testSetup";
import accountActions from "./accountActions";
import { XRP_ACCOUNT, XRP_IOU_TOKEN_ACCOUNT, makeXrpTokenAccount } from "./__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: () => ["iou", "mpt"],
}));

const { SendAction, ReceiveAction } = accountActions;

function renderActions(account = XRP_IOU_TOKEN_ACCOUNT) {
  return render(
    <>
      <SendAction account={account} parentAccount={XRP_ACCOUNT} onClick={jest.fn()} />
      <ReceiveAction account={account} parentAccount={XRP_ACCOUNT} onClick={jest.fn()} />
    </>,
  );
}

describe("xrp accountActions", () => {
  it("disables Send and Receive on a frozen token", () => {
    renderActions(makeXrpTokenAccount({ isLocked: true }));

    expect(screen.getByTestId("send-button")).toBeDisabled();
    expect(screen.getByTestId("receive-account-action-button")).toBeDisabled();
  });

  it("keeps Send and Receive enabled on an unfrozen token", () => {
    renderActions();

    expect(screen.getByTestId("send-button")).toBeEnabled();
    expect(screen.getByTestId("receive-account-action-button")).toBeEnabled();
  });
});
