import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import {
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "./viewModel";

describe("createEmptyContactsListViewModel", () => {
  it("returns the Me row with no addresses", () => {
    expect(createEmptyContactsListViewModel(mockMeContact())).toEqual({
      me: {
        contactId: "contact-me",
        name: "Me",
        initial: "M",
        addressCount: 0,
      },
    });
  });

  it("derives the initial and address count from Me", () => {
    const me = mockMeContact({
      name: "Élodie",
      addresses: [mockContactAddress()],
    });

    expect(createEmptyContactsListViewModel(me)).toEqual({
      me: {
        contactId: "contact-me",
        name: "Élodie",
        initial: "É",
        addressCount: 1,
      },
    });
  });
});

describe("createPopulatedContactsListViewModel", () => {
  it("should keep Me separate and sort saved contacts alphabetically", () => {
    const me = mockMeContact({
      addresses: [mockContactAddress()],
    });
    const contacts = [
      mockContact({ id: "contact-olive", name: "Olive" }),
      me,
      mockContact({
        id: "contact-ben",
        name: "Ben",
        addresses: [mockContactAddress()],
      }),
      mockContact({ id: "contact-ada", name: "Ada" }),
    ];

    expect(createPopulatedContactsListViewModel(me, contacts)).toEqual({
      me: {
        contactId: "contact-me",
        name: "Me",
        initial: "M",
        addressCount: 1,
      },
      savedContacts: [
        {
          contactId: "contact-ada",
          name: "Ada",
          initial: "A",
          addressCount: 0,
        },
        {
          contactId: "contact-ben",
          name: "Ben",
          initial: "B",
          addressCount: 1,
        },
        {
          contactId: "contact-olive",
          name: "Olive",
          initial: "O",
          addressCount: 0,
        },
      ],
    });
  });

  it("should derive initials and address counts for saved contacts", () => {
    const me = mockMeContact();
    const contacts = [
      me,
      mockContact({
        id: "contact-elodie",
        name: "Élodie",
        addresses: [mockContactAddress(), mockContactAddress({ id: "address-polygon" })],
      }),
    ];

    expect(createPopulatedContactsListViewModel(me, contacts).savedContacts).toEqual([
      {
        contactId: "contact-elodie",
        name: "Élodie",
        initial: "É",
        addressCount: 2,
      },
    ]);
  });
});
