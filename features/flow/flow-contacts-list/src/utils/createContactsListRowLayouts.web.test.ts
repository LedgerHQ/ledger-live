import { ContactIdSchema } from "@domain/entity-contact";
import type { ContactsListItem, ContactsListSection } from "../types";
import { createContactsListRowLayouts } from "./createContactsListRowLayouts";

function createContact(name: string, initial: string): ContactsListItem {
  return {
    contactId: ContactIdSchema.parse(`contact-${name.toLowerCase()}`),
    name,
    initial,
    addressCount: 1,
  };
}

const sections: readonly ContactsListSection[] = [
  { title: "A", data: [createContact("Ada", "A"), createContact("Alan", "A")] },
  { title: "B", data: [createContact("Bob", "B")] },
];

const sectionHeaderHeight = 30;
const contactRowHeight = 70;

describe("createContactsListRowLayouts", () => {
  it("lays out a header, its contacts and a zero height footer per section", () => {
    expect(createContactsListRowLayouts(sections, sectionHeaderHeight, contactRowHeight)).toEqual([
      { length: 30, offset: 0 },
      { length: 70, offset: 30 },
      { length: 70, offset: 100 },
      { length: 0, offset: 170 },
      { length: 30, offset: 170 },
      { length: 70, offset: 200 },
      { length: 0, offset: 270 },
    ]);
  });

  it("addresses each section header by the index SectionList scrolls to", () => {
    const layouts = createContactsListRowLayouts(sections, sectionHeaderHeight, contactRowHeight);
    const secondSectionHeaderIndex = sections[0]!.data.length + 2;

    expect(layouts[secondSectionHeaderIndex]).toEqual({ length: 30, offset: 170 });
  });

  it("returns no layouts when there are no sections", () => {
    expect(createContactsListRowLayouts([], sectionHeaderHeight, contactRowHeight)).toEqual([]);
  });
});
