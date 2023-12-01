import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  StatusBar,
  KeyboardAvoidingViewProps,
} from "react-native";
import Config from "react-native-config";
import { HeaderHeightContext } from "@react-navigation/elements";
import { HEIGHT as ExperimentalHeaderHeight } from "~/screens/Settings/Experimental/ExperimentalHeader";
import { useExperimental } from "../experimental";

const { DeviceInfo } = NativeModules;
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
    let behaviorParam: KeyboardAvoidingViewProps["behavior"] | undefined;
    let keyboardVerticalOffset = isExperimental || Config.MOCK ? ExperimentalHeaderHeight : 0;

    if (Platform.OS === "ios") {
      keyboardVerticalOffset += DeviceInfo.isIPhoneX_deprecated ? 88 : 64;
      behaviorParam = behavior || "height";
    }

    return (
      <KeyboardAvoidingView
        style={style}
        keyboardVerticalOffset={
          headerHeight + (StatusBar.currentHeight || 0) + keyboardVerticalOffset
        }
        behavior={behaviorParam}
        enabled
      >
        {children}
      </KeyboardAvoidingView>
    );
  },
);
export default KeyboardView;
