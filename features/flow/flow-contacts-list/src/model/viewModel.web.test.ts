import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { formatTestContactDisplayName } from "@features/platform-contacts/testing";
import {
  createContactsListViewModel,
  createContactsSearchViewModel,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "./viewModel";

const me = mockMeContact({ addresses: [mockContactAddress()] });
const ada = mockContact({ id: "contact-ada", name: "Ada" });
const ben = mockContact({ id: "contact-ben", name: "Ben", addresses: [mockContactAddress()] });
const olive = mockContact({ id: "contact-olive", name: "Olive" });
const contacts = [olive, me, ben, ada];

const search = (query: string, meContact = me) =>
  createContactsSearchViewModel(
    meContact,
    [...contacts, meContact],
    query,
    formatTestContactDisplayName,
  );

describe("createContactsListViewModel", () => {
  it("keeps the raw Me name so the view renders it through the display name rule", () => {
    expect(createEmptyContactsListViewModel(me).me).toEqual({
      contactId: "contact-me",
      name: "Me",
      isMe: true,
      initial: "M",
      addressCount: 1,
    });
  });

  it("returns the empty list when Me is the only contact", () => {
    expect(createContactsListViewModel(me, [me])).toEqual(createEmptyContactsListViewModel(me));
  });

  it("keeps Me apart and sorts saved contacts into alphabetical sections", () => {
    const viewModel = createPopulatedContactsListViewModel(me, contacts);

    expect(viewModel.me.isMe).toBe(true);
    expect(viewModel.savedContacts.map(contact => [contact.name, contact.addressCount])).toEqual([
      ["Ada", 0],
      ["Ben", 1],
      ["Olive", 0],
    ]);
    expect(viewModel.sections.map(section => section.title)).toEqual(["A", "B", "O"]);
  });
});

describe("createContactsSearchViewModel", () => {
  it("returns the full list for a blank query", () => {
    expect(search("  ")).toEqual({
      status: "results",
      ...createPopulatedContactsListViewModel(me, contacts),
    });
  });

  it("matches saved contacts case-insensitively without Me", () => {
    const viewModel = search("bEn");

    expect(viewModel).toMatchObject({ status: "results", savedContacts: [{ name: "Ben" }] });
    expect("me" in viewModel).toBe(false);
  });

  it.each([
    ["the default label", "addresses", me],
    ["the stored name", "Me", me],
    ["a renamed name", "tOtO", mockMeContact({ name: "Toto" })],
    ["the (Me) suffix of a renamed contact", "me", mockMeContact({ name: "Brian" })],
  ])("finds Me by %s", (_, query, meContact) => {
    expect(search(query, meContact)).toMatchObject({
      status: "results",
      me: { contactId: "contact-me", isMe: true },
      savedContacts: [],
    });
  });

  it("returns no results when nothing matches", () => {
    expect(search("zzz")).toEqual({ status: "no-results", displayMode: "empty" });
  });
});
