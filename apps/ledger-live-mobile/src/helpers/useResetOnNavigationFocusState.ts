import { useEffect, useState } from "react";
import { NavigationProp } from "@react-navigation/native";

// A state that resets to its default value when the screen gets the focus from the navigation mechanism
export function useResetOnNavigationFocusState<
  ValueType,
  NavigationType extends NavigationProp<ReactNavigation.RootParamList>,
>(
  navigation: NavigationType,
  defaultValue: ValueType,
): [ValueType, React.Dispatch<React.SetStateAction<ValueType>>] {
  const [value, setValue] = useState<ValueType>(defaultValue);

  useEffect(() => {
    return navigation.addListener("focus", () => {
      setValue(defaultValue);
    });
  }, [navigation, defaultValue]);

  return [value, setValue];
}
