import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactsLedgerSyncIntroductionDialog } from "./ContactsLedgerSyncIntroductionDialog.web";

describe("ContactsLedgerSyncIntroductionDialog", () => {
  it("should render the Ledger Sync explanation and dismiss it once", async () => {
    const onDismiss = jest.fn();
    const user = userEvent.setup();

    render(
      <ContactsLedgerSyncIntroductionDialog
        open
        description="Ledger Sync keeps contacts up to date."
        dismissLabel="Got it"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText("Ledger Sync keeps contacts up to date.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Got it" }));
    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
