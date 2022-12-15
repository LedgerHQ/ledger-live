import { useEffect, useState } from "react";
import { NavigationProp } from "@react-navigation/native";

// A state that resets to its default value when the screen gets the focus from the navigation mechanism
export function useResetOnNavigationFocusState<
  ValueType,
  NavigationType extends NavigationProp<Record<string, unknown>>,
>(
  navigation: NavigationType,
  defaultValue: ValueType,
): [ValueType, React.Dispatch<React.SetStateAction<ValueType>>] {
  const [value, setValue] = useState<ValueType>(defaultValue);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setValue(defaultValue);
    });

    return unsubscribe;
  }, [navigation, defaultValue]);

  return [value, setValue];
}
