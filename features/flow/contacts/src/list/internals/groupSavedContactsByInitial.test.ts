import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createPopulatedContactsListViewModel } from "../viewModel";
import { groupSavedContactsByInitial } from "./groupSavedContactsByInitial";

describe("groupSavedContactsByInitial", () => {
  it("groups alphabetically sorted contacts by their initial", () => {
    const me = mockMeContact();
    const contacts = [
      me,
      mockContact({ id: "contact-ada", name: "Ada" }),
      mockContact({ id: "contact-anna", name: "Anna", addresses: [] }),
      mockContact({ id: "contact-ben", name: "Ben" }),
    ];
    const savedContacts = createPopulatedContactsListViewModel(me, contacts).savedContacts;

    expect(groupSavedContactsByInitial(savedContacts)).toEqual([
      {
        initial: "A",
        contacts: [savedContacts[0], savedContacts[1]],
      },
      {
        initial: "B",
        contacts: [savedContacts[2]],
      },
    ]);
  });

  it("returns an empty list when there are no saved contacts", () => {
    expect(groupSavedContactsByInitial([])).toEqual([]);
  });
});
