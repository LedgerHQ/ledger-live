import { act, renderHook } from "@testing-library/react";
import { ContactIdSchema } from "@domain/entity-contact";
import type { RefObject } from "react";
import type { SectionList } from "react-native";
import type { ContactsListItem, ContactsListSection } from "../../../types";
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
  const scrollTo = jest.fn();
  const getScrollResponder = jest.fn(() => ({ scrollTo }));
  const listRef = {
    current: { scrollToLocation, getScrollResponder },
  } as unknown as RefObject<SectionList<ContactsListItem, ContactsListSection> | null>;

  return { listRef, scrollToLocation, scrollTo };
}

function flushAnimationFrame() {
  return act(async () => {
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
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

  it("jumps without animating while the index is being dragged", () => {
    const { listRef, scrollToLocation } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() => result.current.onSelectSection("З", { animated: false }));

    expect(scrollToLocation).toHaveBeenCalledWith({
      animated: false,
      itemIndex: 0,
      sectionIndex: 1,
      viewOffset: 8,
    });
  });

  it("recovers when the target section has not been measured yet", async () => {
    const { listRef, scrollToLocation, scrollTo } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() => result.current.onSelectSection("ع"));
    act(() =>
      result.current.onScrollToIndexFailed({
        index: 8,
        highestMeasuredFrameIndex: 3,
        averageItemLength: 64,
      }),
    );

    expect(scrollTo).toHaveBeenCalledWith({ y: 512, animated: false });

    await flushAnimationFrame();

    expect(scrollToLocation).toHaveBeenLastCalledWith({
      animated: false,
      itemIndex: 0,
      sectionIndex: 2,
      viewOffset: 8,
    });
  });

  it("stops retrying once the recovery attempts are exhausted", async () => {
    const { listRef, scrollTo } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));
    const failure = { index: 8, highestMeasuredFrameIndex: 3, averageItemLength: 64 };

    act(() => result.current.onSelectSection("ع"));

    for (let attempt = 0; attempt < 8; attempt++) {
      act(() => result.current.onScrollToIndexFailed(failure));
      await flushAnimationFrame();
    }

    expect(scrollTo).toHaveBeenCalledTimes(5);
  });

  it("stays put rather than jumping to the top when there is no usable estimate", () => {
    const { listRef, scrollTo } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() => result.current.onSelectSection("ع"));
    act(() =>
      result.current.onScrollToIndexFailed({
        index: 8,
        highestMeasuredFrameIndex: 3,
        averageItemLength: 0,
      }),
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("ignores a failure that no letter selection asked for", () => {
    const { listRef, scrollTo } = createListRef();
    const { result } = renderHook(() => useContactsSectionIndex({ sections, listRef }));

    act(() =>
      result.current.onScrollToIndexFailed({
        index: 8,
        highestMeasuredFrameIndex: 3,
        averageItemLength: 64,
      }),
    );

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
