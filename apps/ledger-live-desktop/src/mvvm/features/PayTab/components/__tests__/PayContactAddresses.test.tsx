import React from "react";
import { render, screen } from "tests/testSetup";
import { mockContactAddress } from "@domain/entity-contact/schema.mock";
import { PayContactAddresses } from "../PayContactAddresses";

describe("PayContactAddresses", () => {
  it("should render nothing when there are no addresses", () => {
    const { container } = render(<PayContactAddresses addresses={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should show one icon per unique currency", () => {
    render(
      <PayContactAddresses
        addresses={[
          mockContactAddress({ id: "address-eth-1", currencyId: "ethereum", label: "Ethereum" }),
          mockContactAddress({ id: "address-eth-2", currencyId: "ethereum", label: "Ethereum" }),
          mockContactAddress({ id: "address-btc", currencyId: "bitcoin", label: "Bitcoin" }),
        ]}
      />,
    );

    expect(screen.getByTestId("pay-contacts-address-icons")).toBeVisible();
    expect(screen.getByLabelText("ETH, BTC")).toBeVisible();
  });
});
