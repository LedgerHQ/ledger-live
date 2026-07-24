import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { type SectionList, type ViewToken } from "react-native";
import type { ContactsListItem, ContactsListSection } from "../../../types";

const sectionViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
} as const;

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
  onSelectSection: (title: string) => void;
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

  const onSelectSection = useCallback(
    (title: string) => {
      const sectionIndex = sections.findIndex(section => section.title === title);

      if (sectionIndex === -1) {
        return;
      }

      setActiveSectionTitle(title);
      listRef.current?.scrollToLocation({
        animated: true,
        itemIndex: 0,
        sectionIndex,
        viewOffset: 8,
      });
    },
    [listRef, sections],
  );

  return {
    activeSectionTitle,
    sectionIndexEntries,
    onViewableItemsChanged,
    onSelectSection,
    viewabilityConfig: sectionViewabilityConfig,
  };
}
