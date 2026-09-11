import {
  mockContactWithAddress,
  mockMeContact,
  mockMeContactWithAddresses,
  mockPopulatedContacts,
} from "@domain/entity-contact/schema.mock";
import { buildContactsGlobalProperties } from "./buildContactsGlobalProperties";

describe("buildContactsGlobalProperties", () => {
  it("counts saved contacts and splits external addresses between other contacts and Me", () => {
    const contacts = mockPopulatedContacts();

    expect(
      buildContactsGlobalProperties({
        contacts,
      }),
    ).toEqual({
      contactsCount: 5,
      externalAddressesSavedCount: 3,
      myAddressesSavedCount: 3,
    });
  });

  it("returns zero counts when only Me is present without addresses", () => {
    expect(
      buildContactsGlobalProperties({
        contacts: [mockMeContact()],
      }),
    ).toEqual({
      contactsCount: 0,
      externalAddressesSavedCount: 0,
      myAddressesSavedCount: 0,
    });
  });

  it("excludes Me addresses from externalAddressesSavedCount", () => {
    const contacts = [
      mockMeContactWithAddresses(),
      mockContactWithAddress({ id: "contact-ben", name: "Ben" }),
    ];

    expect(
      buildContactsGlobalProperties({
        contacts,
      }),
    ).toMatchObject({
      contactsCount: 1,
      externalAddressesSavedCount: 1,
      myAddressesSavedCount: 3,
    });
  });
});
