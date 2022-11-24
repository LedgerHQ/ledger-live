import { useEffect, useState } from "react";
import { NavigationProp } from "@react-navigation/native";

// Returns a counter that increments itself when the component using it
// gets a new focus from the navigation mechanism
export function useIncrementOnNavigationFocusState<
  NavigationType extends NavigationProp<Record<string, unknown>>,
>(navigation: NavigationType): number {
  const [nonce, setNonce] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setNonce(prev => prev + 1);
    });

    return unsubscribe;
  }, [navigation]);

  return nonce;
}
