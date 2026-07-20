import { ContactIdSchema } from "@domain/entity-contact";
import { createContactsListSections } from "./createContactsListSections";

describe("createContactsListSections", () => {
  it("groups contacts by their displayed initials", () => {
    expect(
      createContactsListSections([
        {
          contactId: ContactIdSchema.parse("contact-zahra"),
          name: "Zahra",
          initial: "Z",
          addressCount: 0,
        },
        {
          contactId: ContactIdSchema.parse("contact-zhanna"),
          name: "Жанна",
          initial: "Ж",
          addressCount: 1,
        },
        {
          contactId: ContactIdSchema.parse("contact-anna"),
          name: "Anna",
          initial: "A",
          addressCount: 2,
        },
        {
          contactId: ContactIdSchema.parse("contact-amelia"),
          name: "Amelia",
          initial: "A",
          addressCount: 0,
        },
      ]),
    ).toEqual([
      {
        title: "A",
        data: [
          {
            contactId: ContactIdSchema.parse("contact-anna"),
            name: "Anna",
            initial: "A",
            addressCount: 2,
          },
          {
            contactId: ContactIdSchema.parse("contact-amelia"),
            name: "Amelia",
            initial: "A",
            addressCount: 0,
          },
        ],
      },
      {
        title: "Z",
        data: [
          {
            contactId: ContactIdSchema.parse("contact-zahra"),
            name: "Zahra",
            initial: "Z",
            addressCount: 0,
          },
        ],
      },
      {
        title: "Ж",
        data: [
          {
            contactId: ContactIdSchema.parse("contact-zhanna"),
            name: "Жанна",
            initial: "Ж",
            addressCount: 1,
          },
        ],
      },
    ]);
  });
});
