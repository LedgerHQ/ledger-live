import React, { useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  KeyboardAvoidingViewProps,
  Keyboard,
  StatusBar,
} from "react-native";
import Config from "react-native-config";
import { HeaderHeightContext } from "@react-navigation/elements";
import { HEIGHT as ExperimentalHeaderHeight } from "~/screens/Settings/Experimental/ExperimentalHeader";
import { useExperimental } from "../experimental";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  style?: KeyboardAvoidingViewProps["style"];
  children: React.ReactNode;
  behavior?: KeyboardAvoidingViewProps["behavior"];
};

const KeyboardView = React.memo<Props>(
  ({
    style = {
      flex: 1,
    },
    children,
    behavior,
  }: Props) => {
    const isExperimental = useExperimental();
    const headerHeight = React.useContext(HeaderHeightContext) ?? 0;
    const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
    const isAndroid35 = Platform.OS === "android" && Platform.Version >= 35;
    const experimentalHeaderHeight = isExperimental || Config.DETOX ? ExperimentalHeaderHeight : 0;
    const insets = useSafeAreaInsets();

    const behaviorParam = behavior ?? "height";
    const behaviorProp: KeyboardAvoidingViewProps["behavior"] = Platform.select({
      ios: behaviorParam,
      android: isAndroid35 ? behaviorParam : undefined,
    });

    useEffect(() => {
      const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
      const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
      const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
      const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    const defaultOffset =
      Platform.OS === "ios"
        ? headerHeight + experimentalHeaderHeight
        : (StatusBar.currentHeight ?? 24) + insets.bottom + 10;
    const offsetToApply = isKeyboardVisible ? defaultOffset : 0;
    return (
      <KeyboardAvoidingView
        style={[style]}
        keyboardVerticalOffset={offsetToApply}
        behavior={behaviorProp}
        enabled
      >
        {children}
      </KeyboardAvoidingView>
    );
  },
);
export default KeyboardView;
