import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactAddressLabelSchema, ContactAddressValueSchema } from "@domain/entity-contact";
import { ContactsAddAddressReviewView } from "./ContactsAddAddressReviewView.web";

const ADDRESS = ContactAddressValueSchema.parse("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034");
const NAME = ContactAddressLabelSchema.parse("Exchange");

describe("ContactsAddAddressReviewView", () => {
  it("should render destination address, currency, network, and name", async () => {
    const onContinue = jest.fn();
    const user = userEvent.setup();

    render(
      <ContactsAddAddressReviewView
        address={ADDRESS}
        currency="Ethereum"
        network="Ethereum"
        name={NAME}
        labels={{
          title: "Review address",
          addressLabel: "Address",
          currencyLabel: "Currency",
          networkLabel: "Network",
          nameLabel: "Address name",
          continue: "Confirm address",
        }}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByTestId("contacts-add-address-review-title")).toHaveTextContent(
      "Review address",
    );
    expect(screen.getByTestId("contacts-add-address-review-address")).toHaveTextContent(ADDRESS);
    expect(screen.getByTestId("contacts-add-address-review-currency")).toHaveTextContent(
      "Ethereum",
    );
    expect(screen.getByTestId("contacts-add-address-review-network")).toHaveTextContent("Ethereum");
    expect(screen.getByTestId("contacts-add-address-review-name")).toHaveTextContent(NAME);

    await user.click(screen.getByTestId("contacts-add-address-review-continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
