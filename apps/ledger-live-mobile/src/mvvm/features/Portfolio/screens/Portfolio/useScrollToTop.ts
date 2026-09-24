import { useCallback, useEffect, useRef } from "react";
import { FlatList } from "react-native";
import { scrollToTopEvent } from "LLM/components/MainTabBar/scrollToTopEvent";
import { useWalletNavScrollContext } from "~/components/WalletTab/WalletTabNavigatorScrollManager";

export function useScrollToTop() {
  const flatListRef = useRef<FlatList | null>(null);
  const { scrollY } = useWalletNavScrollContext();

  const handleFlatListRef = useCallback((ref: FlatList | null) => {
    flatListRef.current = ref;
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollY) {
      scrollY.value = 0;
    }
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [scrollY]);

  useEffect(() => scrollToTopEvent.subscribe(scrollToTop), [scrollToTop]);

  return { handleFlatListRef };
}
