import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { type SectionList, type ViewToken } from "react-native";
import type { ContactsListItem, ContactsListSection } from "../../../types";

const sectionViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
} as const;

const sectionScrollViewOffset = 8;
const maxScrollRecoveryAttempts = 5;

type ScrollToIndexFailure = Readonly<{
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
}>;

type PendingSectionScroll = Readonly<{
  sectionIndex: number;
  attempts: number;
}>;

export type SelectSectionOptions = Readonly<{
  animated?: boolean;
}>;

function getSectionTitle(viewToken: ViewToken<ContactsListItem>): string | undefined {
  const section = viewToken.section;

  return typeof section === "object" &&
    section !== null &&
    "title" in section &&
    typeof section.title === "string"
    ? section.title
    : undefined;
}

type UseContactsSectionIndexOptions = Readonly<{
  sections: readonly ContactsListSection[];
  listRef: RefObject<SectionList<ContactsListItem, ContactsListSection> | null>;
}>;

export function useContactsSectionIndex({
  sections,
  listRef,
}: UseContactsSectionIndexOptions): Readonly<{
  activeSectionTitle: string | undefined;
  sectionIndexEntries: readonly string[];
  onViewableItemsChanged: (info: { viewableItems: ViewToken<ContactsListItem>[] }) => void;
  onSelectSection: (title: string, options?: SelectSectionOptions) => void;
  onScrollToIndexFailed: (info: ScrollToIndexFailure) => void;
  viewabilityConfig: typeof sectionViewabilityConfig;
}> {
  const [activeSectionTitle, setActiveSectionTitle] = useState(() => sections[0]?.title);
  const sectionIndexEntries = useMemo(() => sections.map(section => section.title), [sections]);

  useEffect(() => {
    setActiveSectionTitle(currentTitle =>
      sections.some(section => section.title === currentTitle) ? currentTitle : sections[0]?.title,
    );
  }, [sections]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<ContactsListItem>[] }) => {
      const sectionTitle = viewableItems
        .filter(viewToken => viewToken.isViewable)
        .map(getSectionTitle)
        .find((title): title is string => title !== undefined);

      if (sectionTitle !== undefined) {
        setActiveSectionTitle(currentTitle =>
          currentTitle === sectionTitle ? currentTitle : sectionTitle,
        );
      }
    },
  ).current;

  const pendingScrollRef = useRef<PendingSectionScroll | undefined>(undefined);

  const scrollToSectionIndex = useCallback(
    (sectionIndex: number, animated: boolean) => {
      listRef.current?.scrollToLocation({
        animated,
        itemIndex: 0,
        sectionIndex,
        viewOffset: sectionScrollViewOffset,
      });
    },
    [listRef],
  );

  const onSelectSection = useCallback(
    (title: string, { animated = true }: SelectSectionOptions = {}) => {
      const sectionIndex = sections.findIndex(section => section.title === title);

      if (sectionIndex === -1) {
        return;
      }

      setActiveSectionTitle(title);
      pendingScrollRef.current = { sectionIndex, attempts: 0 };
      scrollToSectionIndex(sectionIndex, animated);
    },
    [scrollToSectionIndex, sections],
  );

  const onScrollToIndexFailed = useCallback(
    ({ averageItemLength, index }: ScrollToIndexFailure) => {
      const pendingScroll = pendingScrollRef.current;

      if (pendingScroll === undefined || pendingScroll.attempts >= maxScrollRecoveryAttempts) {
        pendingScrollRef.current = undefined;
        return;
      }

      // Without a usable estimate this would jump to the top and strand the list there.
      if (averageItemLength <= 0) {
        pendingScrollRef.current = undefined;
        return;
      }

      const { sectionIndex } = pendingScroll;

      pendingScrollRef.current = { sectionIndex, attempts: pendingScroll.attempts + 1 };
      listRef.current?.getScrollResponder()?.scrollTo({
        y: averageItemLength * index,
        animated: false,
      });
      requestAnimationFrame(() => {
        if (pendingScrollRef.current?.sectionIndex === sectionIndex) {
          scrollToSectionIndex(sectionIndex, false);
        }
      });
    },
    [listRef, scrollToSectionIndex],
  );

  return {
    activeSectionTitle,
    sectionIndexEntries,
    onViewableItemsChanged,
    onSelectSection,
    onScrollToIndexFailed,
    viewabilityConfig: sectionViewabilityConfig,
  };
}
