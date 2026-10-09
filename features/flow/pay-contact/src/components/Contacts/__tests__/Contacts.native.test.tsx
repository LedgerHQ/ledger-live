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

function contactTileLabels(): string[] {
  return screen
    .getAllByTestId(/^pay-contacts-tile-/)
    .map(tile => String(tile.props.accessibilityLabel));
}

describe("Contacts (Native)", () => {
  it("should render Me as a payable contact and forward it when pressed", () => {
    const me = mockMeContact();
    const onContactPress = jest.fn();
    renderWithContacts([me], <Contacts {...makeContactsProps({ onContactPress })} />);

    expect(screen.getByTestId("pay-contacts-pay-tile")).toBeVisible();
    expect(screen.getByText("Me")).toBeVisible();
    screen.getByTestId(`pay-contacts-tile-${me.id}`).props.onPress();
    expect(onContactPress).toHaveBeenCalledWith(me);
  });

  it("should render the me contact in its sorted position", () => {
    renderWithContacts(
      [mockMeContact(), mockContact({ id: "contact-ada", name: "Ada" })],
      <Contacts {...makeContactsProps()} />,
    );

    expect(contactTileLabels()).toEqual(["Ada", "Me"]);
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

    expect(screen.getAllByTestId(/^pay-contacts-tile-/)).toHaveLength(8);
    expect(screen.queryByTestId("pay-contacts-tile-contact-0")).toBeNull();
    expect(screen.queryByTestId("pay-contacts-tile-contact-me")).toBeNull();

    screen.getByTestId("pay-contacts-see-all").props.onPress();
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("should not expose see-all when 8 or fewer contacts are saved", () => {
    const savedContacts = Array.from({ length: 7 }, (_, index) =>
      mockContact({ id: `contact-${index}`, name: `Contact ${index}` }),
    );

    renderWithContacts([mockMeContact(), ...savedContacts], <Contacts {...makeContactsProps()} />);

    expect(screen.getAllByTestId(/^pay-contacts-tile-/)).toHaveLength(8);
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

    expect(contactTileLabels()).toEqual(["Bob", "Alice", "Me"]);
  });

  it("should fall back to last added order when no outgoing operation matches", () => {
    renderWithContacts([mockMeContact(), bob, alice], <Contacts {...makeContactsProps()} />);

    expect(contactTileLabels()).toEqual(["Alice", "Bob", "Me"]);
  });

  it("should resolve its copy from the mounted i18n provider, not from props", () => {
    renderWithContacts([mockMeContact()], <Contacts {...makeContactsProps()} />, undefined, {
      en: { translation: { payTab: { contacts: { pay: "Envoyer" } } } },
    });

    expect(screen.getByTestId("pay-contacts-pay-tile").props.accessibilityLabel).toBe("Envoyer");
  });
});
