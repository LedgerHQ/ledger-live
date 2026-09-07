import React from "react";
import { render, screen } from "@testing-library/react-native";
import { mockContact } from "@domain/entity-contact/schema.mock";
import { ContactsView } from "../ContactsView.native";
import type { ContactsViewNativeProps } from "../../../types";

function makeProps(overrides: Partial<ContactsViewNativeProps> = {}): ContactsViewNativeProps {
  return {
    title: "Pay contact",
    payLabel: "Pay",
    contacts: [],
    hasMore: false,
    onPay: jest.fn(),
    onSeeAll: jest.fn(),
    ...overrides,
  };
}

describe("ContactsView (Native)", () => {
  it("should render the section title and the leading Pay tile", () => {
    render(<ContactsView {...makeProps()} />);

    expect(screen.getByTestId("pay-contacts")).toBeTruthy();
    expect(screen.getByText("Pay contact")).toBeTruthy();
    expect(screen.getByTestId("pay-contacts-pay-tile")).toBeTruthy();
    expect(screen.getByText("Pay")).toBeTruthy();
  });

  it("should render no contact tiles when there are no contacts", () => {
    render(<ContactsView {...makeProps()} />);

    expect(screen.queryByTestId("pay-contacts-tile-0")).toBeNull();
  });

  it("should render a tile for each contact", () => {
    const contacts = [
      mockContact({ id: "contact-ada", name: "Ada" }),
      mockContact({ id: "contact-bob", name: "Bob" }),
    ];

    render(<ContactsView {...makeProps({ contacts })} />);

    expect(screen.getByTestId("pay-contacts-tile-0")).toBeVisible();
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByTestId("pay-contacts-tile-1")).toBeVisible();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("should open the Send flow when the Pay tile is pressed", () => {
    const onPay = jest.fn();

    render(<ContactsView {...makeProps({ onPay })} />);
    screen.getByTestId("pay-contacts-pay-tile").props.onPress();

    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it("should keep contact tiles display-only when onContactPress is omitted", () => {
    const contacts = [mockContact({ id: "contact-ada", name: "Ada" })];

    render(<ContactsView {...makeProps({ contacts })} />);

    expect(screen.getByTestId("pay-contacts-tile-0").props.onPress).toBeUndefined();
  });

  it("should forward the pressed contact when onContactPress is provided", () => {
    const contacts = [mockContact({ id: "contact-ada", name: "Ada" })];
    const onContactPress = jest.fn();

    render(<ContactsView {...makeProps({ contacts, onContactPress })} />);
    screen.getByTestId("pay-contacts-tile-0").props.onPress();

    expect(onContactPress).toHaveBeenCalledWith(contacts[0]);
  });

  it("should not expose the see-all affordance when hasMore is false", () => {
    render(<ContactsView {...makeProps({ hasMore: false })} />);

    expect(screen.getByTestId("pay-contacts-see-all").props.onPress).toBeUndefined();
  });

  it("should open the full contacts list from the see-all affordance when hasMore is true", () => {
    const onSeeAll = jest.fn();

    render(<ContactsView {...makeProps({ hasMore: true, onSeeAll })} />);
    screen.getByTestId("pay-contacts-see-all").props.onPress();

    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
