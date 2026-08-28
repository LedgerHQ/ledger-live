import React from "react";
import { screen } from "@testing-library/react-native";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { Contacts } from "../Contacts.native";
import { makeContactsProps, renderWithContacts } from "./shared.native";

describe("Contacts (Native)", () => {
  it("should render only the Pay tile when the store holds no saved contact", () => {
    renderWithContacts([mockMeContact()], <Contacts {...makeContactsProps()} />);

    expect(screen.getByTestId("pay-contacts-pay-tile")).toBeVisible();
    expect(screen.queryByTestId("pay-contacts-tile-0")).toBeNull();
  });

  it("should exclude the me contact and render a tile for each saved contact", () => {
    renderWithContacts(
      [mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })],
      <Contacts {...makeContactsProps()} />,
    );

    expect(screen.getByTestId("pay-contacts-tile-0")).toBeVisible();
    expect(screen.getByText("Ada")).toBeVisible();
    expect(screen.queryByTestId("pay-contacts-tile-1")).toBeNull();
  });

  it("should open the Send flow from the Pay tile", () => {
    const onPay = jest.fn();

    renderWithContacts([mockMeContact()], <Contacts {...makeContactsProps({ onPay })} />);
    screen.getByTestId("pay-contacts-pay-tile").props.onPress();

    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it("should cap the strip at 8 contacts and expose see-all when more are saved", () => {
    const onSeeAll = jest.fn();
    const savedContacts = Array.from({ length: 9 }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    );

    renderWithContacts(
      [mockMeContact(), ...savedContacts],
      <Contacts {...makeContactsProps({ onSeeAll })} />,
    );

    expect(screen.getByTestId("pay-contacts-tile-7")).toBeVisible();
    expect(screen.queryByTestId("pay-contacts-tile-8")).toBeNull();

    screen.getByTestId("pay-contacts-see-all").props.onPress();
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("should not expose see-all when 8 or fewer contacts are saved", () => {
    const savedContacts = Array.from({ length: 8 }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    );

    renderWithContacts([mockMeContact(), ...savedContacts], <Contacts {...makeContactsProps()} />);

    expect(screen.getByTestId("pay-contacts-tile-7")).toBeVisible();
    expect(screen.getByTestId("pay-contacts-see-all").props.onPress).toBeUndefined();
  });
});
