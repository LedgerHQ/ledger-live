import { mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { createPopulatedContactsListViewModel } from "../viewModel";
import { groupSavedContactsByInitial } from "./groupSavedContactsByInitial";

describe("groupSavedContactsByInitial", () => {
  it("groups alphabetically sorted contacts by their initial", () => {
    const contacts = mockPopulatedContacts();
    const me = contacts.find(contact => contact.isMe)!;
    const savedContacts = createPopulatedContactsListViewModel(me, contacts).savedContacts;

    expect(groupSavedContactsByInitial(savedContacts)).toEqual([
      {
        initial: "A",
        contacts: [savedContacts[0]],
      },
      {
        initial: "B",
        contacts: [savedContacts[1]],
      },
      {
        initial: "O",
        contacts: [savedContacts[2]],
      },
    ]);
  });

  it("returns an empty list when there are no saved contacts", () => {
    expect(groupSavedContactsByInitial([])).toEqual([]);
  });
});
