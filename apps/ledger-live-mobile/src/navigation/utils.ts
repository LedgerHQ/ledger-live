import { useEffect } from "react";
import { ScrollView } from "react-native";
import { Subject } from "rxjs/Subject";
import {
  useIsFocused,
  useScrollToTop as useNativeScrollToTop,
} from "@react-navigation/native";

const scrollSubject = new Subject();
export function useScrollToTop(
  ref: React.MutableRefObject<ScrollView | undefined>,
) {
  const isFocused = useIsFocused();
  useNativeScrollToTop(ref);
  useEffect(() => {
    const subscription = scrollSubject.subscribe(() => {
      if (!ref.current || !isFocused) {
        return;
      }

      if (typeof ref.current.scrollTo === "function") {
        // this handles ScrollView
        ref.current.scrollTo();
      } else if (typeof ref.current.scrollToOffset === "function") {
        // this handles FlatList
        ref.current.scrollToOffset({
          offset: 0,
        });
      } else if (typeof ref.current.scrollToLocation === "function") {
        // this handles SectionList
        scrollSectionListToTop(ref.current);
      } else if (
        typeof ref.current.getNode === "function" &&
        typeof ref.current.getNode().scrollToLocation === "function"
      ) {
        // this handles SectionList with Animated wrapper
        scrollSectionListToTop(ref.current.getNode());
      } else if (
        typeof ref.current.getNode === "function" &&
        typeof ref.current.getNode().scrollToOffset === "function"
      ) {
        ref.current.getNode().scrollToOffset({
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

function scrollSectionListToTop(compRef: React.ReactNode): void {
  compRef.scrollToLocation({
    itemIndex: 0,
    sectionIndex: 0,
    // Set big enough offset number for unfixed header height
    viewOffset: 1000,
  });
}

export function scrollToTop(): void {
  scrollSubject.next();
}
