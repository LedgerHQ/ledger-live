import React from "react";
import { FlatList } from "react-native";
import { renderHook, act } from "@tests/test-renderer";
import { scrollToTopEvent } from "LLM/components/MainTabBar/scrollToTopEvent";
import WalletTabNavigatorScrollManager from "~/components/WalletTab/WalletTabNavigatorScrollManager";
import { useScrollToTop } from "../useScrollToTop";

describe("useScrollToTop", () => {
  it("should scroll to top when event is emitted", () => {
    const scrollToOffset = jest.fn();
    const flatListRef = { scrollToOffset };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WalletTabNavigatorScrollManager currentRouteName={undefined}>
        {children}
      </WalletTabNavigatorScrollManager>
    );

    const { result } = renderHook(() => useScrollToTop(), { wrapper });

    act(() => {
      result.current.handleFlatListRef(
        flatListRef as unknown as React.ComponentRef<typeof FlatList>,
      );
    });

    act(() => {
      scrollToTopEvent.emit();
    });

    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: true });
  });
});
