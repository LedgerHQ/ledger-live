import { ContactIdSchema } from "@domain/entity-contact";
import { createContactsListSections } from "./createContactsListSections";

describe("createContactsListSections", () => {
  it("groups contacts by their displayed initials", () => {
    expect(
      createContactsListSections([
        {
          contactId: ContactIdSchema.parse("contact-zahra"),
          name: "Zahra",
          isMe: false,
          initial: "Z",
          addressCount: 0,
        },
        {
          contactId: ContactIdSchema.parse("contact-zhanna"),
          name: "Жанна",
          isMe: false,
          initial: "Ж",
          addressCount: 1,
        },
        {
          contactId: ContactIdSchema.parse("contact-anna"),
          name: "Anna",
          isMe: false,
          initial: "A",
          addressCount: 2,
        },
        {
          contactId: ContactIdSchema.parse("contact-amelia"),
          name: "Amelia",
          isMe: false,
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
            isMe: false,
            initial: "A",
            addressCount: 2,
          },
          {
            contactId: ContactIdSchema.parse("contact-amelia"),
            name: "Amelia",
            isMe: false,
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
            isMe: false,
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
            isMe: false,
            initial: "Ж",
            addressCount: 1,
          },
        ],
      },
    ]);
  });
});
