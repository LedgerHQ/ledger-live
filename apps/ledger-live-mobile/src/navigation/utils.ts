import { useEffect } from "react";
import { ScrollView, FlatList, SectionList } from "react-native";
import { Subject } from "rxjs";
import { useIsFocused, useScrollToTop as useNativeScrollToTop } from "@react-navigation/native";

export type Animated<T> = T & {
  getNode: () => T;
};

const scrollSubject = new Subject();
export function useScrollToTop(
  ref: React.MutableRefObject<
    ScrollView | FlatList | SectionList | Animated<SectionList> | Animated<FlatList> | null
  >,
) {
  const isFocused = useIsFocused();
  useNativeScrollToTop(ref);
  useEffect(() => {
    const subscription = scrollSubject.subscribe(() => {
      if (!ref.current || !isFocused) {
        return;
      }

      if (typeof (ref as React.MutableRefObject<ScrollView>).current.scrollTo === "function") {
        // this handles ScrollView
        (ref.current as ScrollView).scrollTo();
      } else if (
        typeof (ref as React.MutableRefObject<FlatList>).current.scrollToOffset === "function"
      ) {
        // this handles FlatList
        (ref.current as FlatList).scrollToOffset({
          offset: 0,
        });
      } else if (
        typeof (ref as React.MutableRefObject<SectionList>).current.scrollToLocation === "function"
      ) {
        // this handles SectionList
        scrollSectionListToTop((ref as React.MutableRefObject<SectionList>).current);
      } else if (
        typeof (ref as React.MutableRefObject<Animated<SectionList>>).current.getNode ===
          "function" &&
        typeof (ref as React.MutableRefObject<Animated<SectionList>>).current.getNode()
          .scrollToLocation === "function"
      ) {
        // this handles SectionList with Animated wrapper
        scrollSectionListToTop(
          (ref as React.MutableRefObject<Animated<SectionList>>).current.getNode(),
        );
      } else if (
        typeof (ref as React.MutableRefObject<Animated<FlatList>>).current.getNode === "function" &&
        typeof (ref as React.MutableRefObject<Animated<FlatList>>).current.getNode()
          .scrollToOffset === "function"
      ) {
        (ref as React.MutableRefObject<Animated<FlatList>>).current.getNode().scrollToOffset({
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
