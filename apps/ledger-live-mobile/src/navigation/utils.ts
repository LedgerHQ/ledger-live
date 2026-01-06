import { useEffect } from "react";
import { ScrollView, FlatList, SectionList } from "react-native";
import { Subject } from "rxjs";
import { useIsFocused, useScrollToTop as useNativeScrollToTop } from "@react-navigation/native";

export type Animated<T> = T & {
  getNode: () => T;
};

const scrollSubject = new Subject();
export function useScrollToTop(
  ref: React.RefObject<
    ScrollView | FlatList | SectionList | Animated<SectionList> | Animated<FlatList> | null
  >,
) {
  const isFocused = useIsFocused();
  useNativeScrollToTop(ref);
  useEffect(() => {
    const subscription = scrollSubject.subscribe(() => {
      const current = ref.current;
      if (!current || !isFocused) {
        return;
      }

      if (typeof (current as ScrollView).scrollTo === "function") {
        // this handles ScrollView
        (current as ScrollView).scrollTo();
      } else if (typeof (current as FlatList).scrollToOffset === "function") {
        // this handles FlatList
        (current as FlatList).scrollToOffset({
          offset: 0,
        });
      } else if (typeof (current as SectionList).scrollToLocation === "function") {
        // this handles SectionList
        scrollSectionListToTop(current as SectionList);
      } else if (
        typeof (current as Animated<SectionList>).getNode === "function" &&
        typeof (current as Animated<SectionList>).getNode().scrollToLocation === "function"
      ) {
        // this handles SectionList with Animated wrapper
        scrollSectionListToTop((current as Animated<SectionList>).getNode());
      } else if (
        typeof (current as Animated<FlatList>).getNode === "function" &&
        typeof (current as Animated<FlatList>).getNode().scrollToOffset === "function"
      ) {
        (current as Animated<FlatList>).getNode().scrollToOffset({
          animated: true,
          offset: 0,
        });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [isFocused, ref]);
}

function scrollSectionListToTop(compRef: SectionList | Animated<SectionList>): void {
  compRef.scrollToLocation({
    itemIndex: 0,
    sectionIndex: 0,
    // Set big enough offset number for unfixed header height
    viewOffset: 1000,
  });
}

export function scrollToTop(): void {
  scrollSubject.next(null);
}
