import { useCallback, useContext, useEffect, useRef } from "react";
import { FlatList } from "react-native";
import { scrollToTopEvent } from "LLM/components/MainTabBar/scrollToTopEvent";
import { WalletTabNavigatorScrollContext } from "~/components/WalletTab/WalletTabNavigatorScrollManager";

export function useScrollToTop() {
  const flatListRef = useRef<FlatList | null>(null);
  const { scrollY } = useContext(WalletTabNavigatorScrollContext);

  const handleFlatListRef = useCallback((ref: FlatList | null) => {
    flatListRef.current = ref;
  }, []);

  const scrollToTop = useCallback(() => {
    scrollY?.setValue(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [scrollY]);

  useEffect(() => scrollToTopEvent.subscribe(scrollToTop), [scrollToTop]);

  return { handleFlatListRef };
}
