// @flow
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  StatusBar,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { HEIGHT as ExperimentalHeaderHeight } from "../screens/Settings/Experimental/ExperimentalHeader";
import { useExperimental } from "../experimental";

const { DeviceInfo } = NativeModules;

type Props = {
  style?: *,
  children: React$Node,
};

const KeyboardView = React.memo<Props>(
  ({ style = { flex: 1 }, children }: *) => {
    const isExperimental = useExperimental();
    const headerHeight = useHeaderHeight();

    let behavior;
    let keyboardVerticalOffset = isExperimental ? ExperimentalHeaderHeight : 0;
    if (Platform.OS === "ios") {
      keyboardVerticalOffset += DeviceInfo.isIPhoneX_deprecated ? 88 : 64;
      behavior = "height";
    }

    return (
      <KeyboardAvoidingView
        style={style}
        keyboardVerticalOffset={
          headerHeight + StatusBar.currentHeight + keyboardVerticalOffset
        }
        behavior={behavior}
        enabled
      >
        {children}
      </KeyboardAvoidingView>
    );
  },
);

export default KeyboardView;
