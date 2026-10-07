/**
 * @jest-environment jsdom
 */
import React from "react";
import BigNumber from "bignumber.js";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { render, screen } from "tests/testSetup";
import type { Transaction } from "@ledgerhq/live-common/families/aleo/types";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";
import { AleoEstimatedTimeRow } from "../AleoEstimatedTimeRow";

const transaction = {
  family: "aleo",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
} as Transaction;

function renderInSendDialog() {
  return render(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <AleoEstimatedTimeRow account={ALEO_MAIN_ACCOUNT} transaction={transaction} />
      </DialogContent>
    </Dialog>,
  );
}

describe("AleoEstimatedTimeRow", () => {
  it("covers the send dialog with a backdrop placed under the info dialog", async () => {
    const { user } = renderInSendDialog();
    expect(screen.queryByTestId("send-estimated-time-info-backdrop")).toBeNull();

    await user.click(screen.getByTestId("send-estimated-time-info-button"));

    const backdrop = screen.getByTestId("send-estimated-time-info-backdrop");
    const infoDialog = screen.getByTestId("send-estimated-time-info-dialog");
    expect(backdrop.parentElement).toBe(document.body);
    expect(
      backdrop.compareDocumentPosition(infoDialog) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("removes the backdrop once the info dialog is closed", async () => {
    const { user } = renderInSendDialog();

    await user.click(screen.getByTestId("send-estimated-time-info-button"));
    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.queryByTestId("send-estimated-time-info-backdrop")).toBeNull();
  });
});
