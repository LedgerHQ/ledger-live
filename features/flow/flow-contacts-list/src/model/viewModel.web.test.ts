import { mockContact, mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import type { Contact } from "@domain/entity-contact";
import {
  createContactsListViewModel,
  createContactsSearchViewModel,
  createEmptyContactsListViewModel,
  createPopulatedContactsListViewModel,
} from "./viewModel";
import { renderHook } from "@testing-library/react";
import { useContactDisplayName } from "@features/platform-contacts";
import { ContactsI18nTestProvider } from "@features/platform-contacts/testing";

let getDisplayName: (contact: Contact) => string;

beforeAll(() => {
  getDisplayName = renderHook(() => useContactDisplayName(), {
    wrapper: ContactsI18nTestProvider,
  }).result.current;
});

describe("createEmptyContactsListViewModel", () => {
  it("returns the Me row with no addresses", () => {
    expect(createEmptyContactsListViewModel(mockMeContact(), getDisplayName)).toEqual({
      displayMode: "empty",
      me: {
        contactId: "contact-me",
        name: "My addresses (Me)",
        initial: "M",
        addressCount: 0,
      },
    });
  });

  it("derives the initial and address count from Me", () => {
    const me = mockMeContact({
      name: "Алексей",
      addresses: [mockContactAddress()],
    });

    expect(createEmptyContactsListViewModel(me, getDisplayName)).toEqual({
      displayMode: "empty",
      me: {
        contactId: "contact-me",
        name: "Алексей (Me)",
        initial: "А",
        addressCount: 1,
      },
    });
  });

  it("suffixes the default Me label when the stored name is Me", () => {
    expect(createEmptyContactsListViewModel(mockMeContact(), getDisplayName).me.name).toBe(
      "My addresses (Me)",
    );
  });
});

describe("createContactsListViewModel", () => {
  it("returns an empty list when only Me is present", () => {
    const me = mockMeContact();

    expect(createContactsListViewModel(me, [me], getDisplayName)).toEqual(
      createEmptyContactsListViewModel(me, getDisplayName),
    );
  });

  it("returns a populated list when saved contacts exist", () => {
    const me = mockMeContact();
    const contacts = [me, mockContact({ id: "contact-ada", name: "Ada" })];

    expect(createContactsListViewModel(me, contacts, getDisplayName)).toEqual(
      createPopulatedContactsListViewModel(me, contacts, getDisplayName),
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

    expect(createPopulatedContactsListViewModel(me, contacts, getDisplayName)).toEqual({
      displayMode: "populated",
      me: {
        contactId: "contact-me",
        name: "My addresses (Me)",
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
        id: "contact-alexei",
        name: "Алексей",
        addresses: [mockContactAddress(), mockContactAddress({ id: "address-polygon" })],
      }),
    ];

    expect(
      createPopulatedContactsListViewModel(me, contacts, getDisplayName).savedContacts,
    ).toEqual([
      {
        contactId: "contact-alexei",
        name: "Алексей",
        initial: "А",
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
    expect(createContactsSearchViewModel(me, contacts, "  ", getDisplayName)).toMatchObject({
      status: "results",
      displayMode: "populated",
      me: {
        contactId: "contact-me",
        name: "My addresses (Me)",
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
    const viewModel = createContactsSearchViewModel(me, contacts, "bEn", getDisplayName);

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
    expect(createContactsSearchViewModel(me, contacts, "Me", getDisplayName)).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "My addresses (Me)",
        initial: "M",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });

  it("should match Me using the default display name", () => {
    expect(createContactsSearchViewModel(me, contacts, "addresses", getDisplayName)).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "My addresses (Me)",
        initial: "M",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });

  it("should still match Me when searching the stored name", () => {
    expect(createContactsSearchViewModel(me, contacts, "Me", getDisplayName)).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "My addresses (Me)",
        initial: "M",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });

  it("should match Me using its renamed value", () => {
    const renamedMe = mockMeContact({ name: "Toto" });

    expect(
      createContactsSearchViewModel(renamedMe, [renamedMe], "tOtO", getDisplayName),
    ).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "Toto (Me)",
        initial: "T",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });

  it("should match Me when searching for Me on a renamed contact", () => {
    const renamedMe = mockMeContact({ name: "Brian" });

    expect(
      createContactsSearchViewModel(renamedMe, [renamedMe], "me", getDisplayName),
    ).toMatchObject({
      status: "results",
      me: {
        contactId: "contact-me",
        name: "Brian (Me)",
        initial: "B",
        addressCount: 0,
      },
      savedContacts: [],
    });
  });
});
