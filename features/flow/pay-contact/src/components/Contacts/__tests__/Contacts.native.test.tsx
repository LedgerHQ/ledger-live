import React from "react";
import { screen } from "@testing-library/react-native";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import type { OutgoingOperation } from "@features/platform-contacts";
import { Contacts } from "../Contacts.native";
import { makeContactsProps, renderWithContacts } from "./shared.native";

describe("Contacts (Native)", () => {
  it("should render Me as a payable contact and forward it when pressed", () => {
    const me = mockMeContact();
    const onContactPress = jest.fn();
    renderWithContacts([me], <Contacts {...makeContactsProps({ onContactPress })} />);

    expect(screen.getByTestId("pay-contacts-pay-tile")).toBeVisible();
    expect(screen.getByText("Me")).toBeVisible();
    screen.getByTestId("pay-contacts-tile-0").props.onPress();
    expect(onContactPress).toHaveBeenCalledWith(me);
  });

  it("should render the me contact and every saved contact", () => {
    renderWithContacts(
      [mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })],
      <Contacts {...makeContactsProps()} />,
    );

    expect(screen.getByTestId("pay-contacts-tile-0").props.accessibilityLabel).toBe("Me");
    expect(screen.getByTestId("pay-contacts-tile-1").props.accessibilityLabel).toBe("Ada");
  });

  it("should open the Send flow from the Pay tile", () => {
    const onPay = jest.fn();

    renderWithContacts([mockMeContact()], <Contacts {...makeContactsProps({ onPay })} />);
    screen.getByTestId("pay-contacts-pay-tile").props.onPress();

    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it("should render every saved contact and expose see-all when more than 8 are saved", () => {
    const onSeeAll = jest.fn();
    const savedContacts = Array.from({ length: 14 }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    );

    renderWithContacts(
      [mockMeContact(), ...savedContacts],
      <Contacts {...makeContactsProps({ onSeeAll })} />,
    );

    expect(screen.getByTestId("pay-contacts-tile-7")).toBeVisible();
    expect(screen.getByTestId("pay-contacts-tile-14")).toBeVisible();

    screen.getByTestId("pay-contacts-see-all").props.onPress();
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("should not expose see-all when 8 or fewer contacts are saved", () => {
    const savedContacts = Array.from({ length: 7 }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    );

    renderWithContacts([mockMeContact(), ...savedContacts], <Contacts {...makeContactsProps()} />);

    expect(screen.getByTestId("pay-contacts-tile-7")).toBeVisible();
    expect(screen.getByTestId("pay-contacts-see-all").props.onPress).toBeUndefined();
  });

  const bobAddress = "0x1111111111111111111111111111111111111111";
  const aliceAddress = "0x2222222222222222222222222222222222222222";

  const bob = mockContactWithAddress({
    id: "contact-bob",
    name: "Bob",
    addresses: [mockContactAddress({ id: "addr-bob", address: bobAddress })],
  });
  const alice = mockContactWithAddress({
    id: "contact-alice",
    name: "Alice",
    addresses: [mockContactAddress({ id: "addr-alice", address: aliceAddress })],
  });

  it("should order the contact sent to most recently first, ahead of the one added last", () => {
    const sentToBob: OutgoingOperation[] = [
      { recipientAddress: bobAddress, date: 1_700_000_000_000, currencyId: "ethereum" },
    ];

    renderWithContacts(
      [mockMeContact(), bob, alice],
      <Contacts {...makeContactsProps({ outgoingOperations: sentToBob })} />,
    );

    expect(screen.getByTestId("pay-contacts-tile-0").props.accessibilityLabel).toBe("Me");
    expect(screen.getByTestId("pay-contacts-tile-1").props.accessibilityLabel).toBe("Bob");
    expect(screen.getByTestId("pay-contacts-tile-2").props.accessibilityLabel).toBe("Alice");
  });

  it("should fall back to last added order when no outgoing operation matches", () => {
    renderWithContacts([mockMeContact(), bob, alice], <Contacts {...makeContactsProps()} />);

    expect(screen.getByTestId("pay-contacts-tile-0").props.accessibilityLabel).toBe("Me");
    expect(screen.getByTestId("pay-contacts-tile-1").props.accessibilityLabel).toBe("Alice");
    expect(screen.getByTestId("pay-contacts-tile-2").props.accessibilityLabel).toBe("Bob");
  });

  it("should resolve its copy from the mounted i18n provider, not from props", () => {
    renderWithContacts([mockMeContact()], <Contacts {...makeContactsProps()} />, undefined, {
      en: { translation: { payTab: { contacts: { pay: "Envoyer" } } } },
    });

    expect(screen.getByTestId("pay-contacts-pay-tile").props.accessibilityLabel).toBe("Envoyer");
  });
});
