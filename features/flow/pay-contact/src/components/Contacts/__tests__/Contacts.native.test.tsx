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
});
