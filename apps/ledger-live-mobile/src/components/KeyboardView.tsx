import React from "react";
import { KeyboardAvoidingView, Platform, StatusBar, KeyboardAvoidingViewProps } from "react-native";
import Config from "react-native-config";
import { HeaderHeightContext } from "@react-navigation/elements";
import { HEIGHT as ExperimentalHeaderHeight } from "~/screens/Settings/Experimental/ExperimentalHeader";
import { useExperimental } from "../experimental";

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
    const headerHeight = React.useContext(HeaderHeightContext) || 0;
    const isAndroid35 = Platform.OS === "android" && Platform.Version >= 35;
    const experimentalHeaderHeight = isExperimental || Config.DETOX ? ExperimentalHeaderHeight : 0;
    const keyboardVerticalOffset = isAndroid35
      ? headerHeight + experimentalHeaderHeight
      : headerHeight + (StatusBar.currentHeight || 0) + experimentalHeaderHeight;
    const behaviorParam = behavior ?? "height";
    const behaviorProp: KeyboardAvoidingViewProps["behavior"] = Platform.select({
      ios: behaviorParam,
      // On Android 34 or below, we leave it undefined to use the default behavior
      // otherwise it can cause the keyboard avoiding to re-render infinitely in
      // some cases like going back from a modal.
      android: isAndroid35 ? "height" : undefined,
    });

    return (
      <KeyboardAvoidingView
        style={[style]}
        keyboardVerticalOffset={keyboardVerticalOffset}
        behavior={behaviorProp}
        enabled
      >
        {children}
      </KeyboardAvoidingView>
    );
  },
);
export default KeyboardView;
