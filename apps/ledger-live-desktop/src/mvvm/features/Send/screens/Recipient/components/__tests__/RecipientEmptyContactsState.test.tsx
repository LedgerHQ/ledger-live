import React from "react";
import { render, screen } from "tests/testSetup";
import { RecipientEmptyContactsState } from "../RecipientEmptyContactsState";

describe("RecipientEmptyContactsState", () => {
  it("renders the empty contacts placeholder", () => {
    render(<RecipientEmptyContactsState />);

    expect(screen.getByTestId("send-recipient-empty-contacts-state")).toBeVisible();
    expect(screen.getByText("Contacts will appear here")).toBeVisible();
  });
});
