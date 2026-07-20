import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import {
  createContactsListViewModel,
  createContactsSearchViewModel,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "./viewModel";

describe("createEmptyContactsListViewModel", () => {
  it("returns the Me row with no addresses", () => {
    expect(createEmptyContactsListViewModel(mockMeContact())).toEqual({
      displayMode: "empty",
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
      displayMode: "empty",
      me: {
        contactId: "contact-me",
        name: "Élodie",
        initial: "É",
        addressCount: 1,
      },
    });
  });
});

describe("createContactsListViewModel", () => {
  it("returns an empty list when only Me is present", () => {
    const me = mockMeContact();

    expect(createContactsListViewModel(me, [me])).toEqual(createEmptyContactsListViewModel(me));
  });

  it("returns a populated list when saved contacts exist", () => {
    const me = mockMeContact();
    const contacts = [
      me,
      mockContact({ id: "contact-ada", name: "Ada" }),
    ];

    expect(createContactsListViewModel(me, contacts)).toEqual(
      createPopulatedContactsListViewModel(me, contacts),
    );
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
      displayMode: "populated",
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
      sections: [
        {
          title: "A",
          data: [
            {
              contactId: "contact-ada",
              name: "Ada",
              initial: "A",
              addressCount: 0,
            },
          ],
        },
        {
          title: "B",
          data: [
            {
              contactId: "contact-ben",
              name: "Ben",
              initial: "B",
              addressCount: 1,
            },
          ],
        },
        {
          title: "O",
          data: [
            {
              contactId: "contact-olive",
              name: "Olive",
              initial: "O",
              addressCount: 0,
            },
          ],
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

describe("createContactsSearchViewModel", () => {
  const me = mockMeContact();
  const contacts = [
    mockContact({ id: "contact-olive", name: "Olive" }),
    me,
    mockContact({ id: "contact-ben", name: "Ben" }),
    mockContact({ id: "contact-ada", name: "Ada" }),
  ];

  it("should return the populated list for an empty query", () => {
    expect(createContactsSearchViewModel(me, contacts, "  ")).toMatchObject({
      status: "results",
      displayMode: "populated",
      me: {
        contactId: "contact-me",
        name: "Me",
        initial: "M",
        addressCount: 0,
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
          addressCount: 0,
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

  it("should return case-insensitive saved contact matches", () => {
    const viewModel = createContactsSearchViewModel(me, contacts, "bEn");

    expect(viewModel).toMatchObject({
      status: "results",
      savedContacts: [
        {
          contactId: "contact-ben",
          name: "Ben",
          initial: "B",
          addressCount: 0,
        },
      ],
    });
    expect("me" in viewModel).toBe(false);
  });

  it("should return Me when its name matches the query", () => {
    expect(createContactsSearchViewModel(me, contacts, "Me")).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "Me",
        initial: "M",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });

  it("should match Me using its renamed value", () => {
    const renamedMe = mockMeContact({ name: "Toto" });

    expect(createContactsSearchViewModel(renamedMe, [renamedMe], "tOtO")).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "Toto",
        initial: "T",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });
});
