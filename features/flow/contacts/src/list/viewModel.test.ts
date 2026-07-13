import { mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createEmptyContactsListViewModel } from "./viewModel";

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
      name: "Olive",
      addresses: [mockContactAddress()],
    });

    expect(createEmptyContactsListViewModel(me)).toEqual({
      me: {
        contactId: "contact-me",
        name: "Olive",
        initial: "O",
        addressCount: 1,
      },
    });
  });
});
