import { useEffect, type RefObject } from "react";
import { InteractionManager, Platform, type TextInput } from "react-native";
import { useNavigation, type ParamListBase } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export function useAutoFocusOnEnter(ref: RefObject<Pick<TextInput, "focus"> | null>) {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  useEffect(() => {
    const focusInput = () => ref.current?.focus();

    if (Platform.OS === "ios") {
      const task = InteractionManager.runAfterInteractions(focusInput);
      return () => task.cancel();
    }

    // Android only opens the soft keyboard once the enter transition has finished,
    // so focus on transitionEnd (the fade runs on the parent stack) rather than
    // guessing a delay. Unsubscribe after the first focus so the screen, which
    // stays mounted in history, isn't re-focused on later transitions.
    const stack = navigation.getParent<NativeStackNavigationProp<ParamListBase>>() ?? navigation;
    let unsubscribe = () => {};
    unsubscribe = stack.addListener("transitionEnd", e => {
      if (!e.data.closing) {
        focusInput();
        unsubscribe();
      }
    });
    return () => unsubscribe();
  }, [navigation, ref]);
}
