// @flow
import React from "react";
import { KeyboardAvoidingView, Platform, NativeModules } from "react-native";
import { HEIGHT as ExperimentalHeaderHeight } from "../screens/Settings/Experimental/ExperimentalHeader";
import useExperimental from "../screens/Settings/Experimental/useExperimental";

const { DeviceInfo } = NativeModules;

type Props = {
  style?: *,
  children: React$Node,
};

const KeyboardView = React.memo<Props>(
  ({ style = { flex: 1 }, children }: *) => {
    const isExperimental = useExperimental();
    let behavior;
    let keyboardVerticalOffset = isExperimental ? ExperimentalHeaderHeight : 0;
    if (Platform.OS === "ios") {
      keyboardVerticalOffset += DeviceInfo.isIPhoneX_deprecated ? 88 : 64;
      behavior = "padding";
    }

    return (
      <KeyboardAvoidingView
        style={style}
        keyboardVerticalOffset={keyboardVerticalOffset}
        behavior={behavior}
        enabled
      >
        {children}
      </KeyboardAvoidingView>
    );
  },
);

export default KeyboardView;
