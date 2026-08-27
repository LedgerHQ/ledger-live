import React, { useMemo } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MainTabBar } from "LLM/components/MainTabBar";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { NavigatorName } from "~/const";

type Params = {
  isMainNavigatorVisible: boolean;
};

export function useTabBar({
  isMainNavigatorVisible,
}: Params): (props: BottomTabBarProps) => React.JSX.Element {
  const { isKeyboardVisible } = useKeyboardVisible();

  return useMemo(
    () =>
      ({ ...props }: BottomTabBarProps): React.ReactElement => {
        const isSwapTabFocused = props.state.routes[props.state.index]?.name === NavigatorName.Swap;
        if (isSwapTabFocused) {
          const { SwapAwareTabBar } =
            require("./SwapAwareTabBar") as typeof import("./SwapAwareTabBar");
          return (
            <SwapAwareTabBar
              {...props}
              isMainNavigatorVisible={isMainNavigatorVisible}
              isKeyboardVisible={isKeyboardVisible}
            />
          );
        }

        return <MainTabBar {...props} hideTabBar={!isMainNavigatorVisible} />;
      },
    [isMainNavigatorVisible, isKeyboardVisible],
  );
}
