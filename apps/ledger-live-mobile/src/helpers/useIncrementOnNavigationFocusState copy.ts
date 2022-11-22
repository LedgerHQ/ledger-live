import { useEffect, useState } from "react";
import { NavigationProp } from "@react-navigation/native";

// TODO: fix type
// A state that increments a counter on focus from the navigation mechanism
export function useIncrementOnNavigationFocusState<
  NavigationType extends NavigationProp<ReactNavigation.RootParamList>,
>(navigation: NavigationType): number {
  const [nonce, setNonce] = useState<number>(0);

  useEffect(() => {
    return navigation.addListener("focus", () => {
      setNonce(prev => prev + 1);
    });
  }, [navigation]);

  return nonce;
}
