import { useEffect, useState } from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";

// A state that resets to its default value when the screen gets the focus from the navigation mechanism
export function useResetOnNavigationFocusState<
  NavigationType extends NavigationProp<ParamListBase>,
  ValueType,
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
