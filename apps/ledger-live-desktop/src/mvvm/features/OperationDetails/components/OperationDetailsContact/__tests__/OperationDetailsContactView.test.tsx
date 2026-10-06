import React from "react";
import { render, screen } from "tests/testSetup";
import { ContactIdSchema } from "@domain/entity-contact";
import { OperationDetailsContactView } from "../OperationDetailsContactView";

describe("OperationDetailsContactView", () => {
  it("should show the contact name with its avatar", () => {
    render(
      <OperationDetailsContactView
        contact={{
          name: "Payee 1",
          contactId: ContactIdSchema.parse("contact-payee"),
          rawName: "Payee 1",
          isMe: false,
        }}
      />,
    );

    expect(screen.getByTestId("operation-details-contact")).toBeVisible();
    expect(screen.getByText("Payee 1")).toBeVisible();
    expect(screen.getByTestId("contacts-avatar-contact-payee")).toBeVisible();
  });
});
