import { act, renderHook } from "@testing-library/react";
import { ContactIdSchema } from "@domain/entity-contact";
import type { RefObject } from "react";
import type { SectionList } from "react-native";
import type { ContactsListItem, ContactsListSection } from "../types";
import { useContactsSectionIndex } from "./useContactsSectionIndex.native";

const sections: readonly ContactsListSection[] = [
  {
    title: "A",
    data: [
      {
        contactId: ContactIdSchema.parse("contact-ada"),
        name: "Ada",
        initial: "A",
        addressCount: 0,
      },
    ],
  },
  {
    title: "З",
    data: [
      {
        contactId: ContactIdSchema.parse("contact-zoya"),
        name: "Зоя",
        initial: "З",
        addressCount: 1,
      },
    ],
  },
  {
    title: "ع",
    data: [
      {
        contactId: ContactIdSchema.parse("contact-ali"),
        name: "علي",
        initial: "ع",
        addressCount: 2,
      },
    ],
  },
];

function createListRef() {
  const scrollToLocation = jest.fn();
  const listRef = {
    current: { scrollToLocation },
  } as unknown as RefObject<SectionList<ContactsListItem, ContactsListSection> | null>;

  return { listRef, scrollToLocation };
}

describe("useContactsSectionIndex", () => {
  it("derives the interactive entries from the displayed sections", () => {
    const { listRef } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    expect(result.current.sectionIndexEntries).toEqual(["A", "З", "ع"]);
    expect(result.current.activeSectionTitle).toBe("A");
  });

  it("updates the active section from the visible list items", () => {
    const { listRef } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() => {
      result.current.onViewableItemsChanged({
        viewableItems: [
          {
            item: sections[1]?.data[0],
            key: "contact-zoya",
            index: 0,
            isViewable: true,
            section: sections[1],
          },
        ],
      });
    });

    expect(result.current.activeSectionTitle).toBe("З");
  });

  it("ignores visible items without a contacts section", () => {
    const { listRef } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() => {
      result.current.onViewableItemsChanged({
        viewableItems: [
          {
            item: sections[1]?.data[0],
            key: "contact-zoya",
            index: 0,
            isViewable: true,
          },
        ],
      });
    });

    expect(result.current.activeSectionTitle).toBe("A");
  });

  it("scrolls to the selected section", () => {
    const { listRef, scrollToLocation } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() => result.current.onSelectSection("ع"));

    expect(scrollToLocation).toHaveBeenCalledWith({
      animated: true,
      itemIndex: 0,
      sectionIndex: 2,
      viewOffset: 8,
    });
    expect(result.current.activeSectionTitle).toBe("ع");
  });
});
