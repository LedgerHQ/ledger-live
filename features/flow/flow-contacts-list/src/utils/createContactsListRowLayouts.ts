import type { ContactsListSection } from "../types";

export type ContactsListRowLayout = Readonly<{
  length: number;
  offset: number;
}>;

/**
 * `SectionList` flattens each section into a header row, its contact rows, then a footer row, and
 * addresses them by that combined index. Section footers render nothing here, so they take no space.
 */
export function createContactsListRowLayouts(
  sections: readonly ContactsListSection[],
  sectionHeaderHeight: number,
  contactRowHeight: number,
): readonly ContactsListRowLayout[] {
  const layouts: ContactsListRowLayout[] = [];
  let offset = 0;

  for (const section of sections) {
    layouts.push({ length: sectionHeaderHeight, offset });
    offset += sectionHeaderHeight;

    for (let row = 0; row < section.data.length; row++) {
      layouts.push({ length: contactRowHeight, offset });
      offset += contactRowHeight;
    }

    layouts.push({ length: 0, offset });
  }

  return layouts;
}
