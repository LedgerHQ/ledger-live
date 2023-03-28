import { useEffect, useState } from "react";
import { NavigationProp } from "@react-navigation/native";

// Returns a counter that increments itself when the component using it
// gets a new focus from the navigation mechanism
export function useIncrementOnNavigationFocusState<
  NavigationType extends NavigationProp<Record<string, unknown>>,
>(navigation: NavigationType): number {
  const [nonce, setNonce] = useState<number>(0);
  // Avoids forcing the rendering on the first focus on the screen.
  // Otherwise nonce is already incremented on the first focus.
  const [firstFocus, setFirstFocus] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (firstFocus) {
        setFirstFocus(false);
        return;
      }

      setNonce(prev => prev + 1);
    });

    return unsubscribe;
  }, [navigation, firstFocus]);

  return nonce;
}
