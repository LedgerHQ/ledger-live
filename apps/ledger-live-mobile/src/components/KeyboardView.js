// @flow
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  StatusBar,
} from "react-native";
import { HeaderHeightContext } from "@react-navigation/elements";
import { HEIGHT as ExperimentalHeaderHeight } from "../screens/Settings/Experimental/ExperimentalHeader";
import { useExperimental } from "../experimental";

const { DeviceInfo } = NativeModules;

type Props = {
  style?: *,
  children: React$Node,
  behavior?: string,
};

const KeyboardView = React.memo<Props>(
  ({ style = { flex: 1 }, children, behavior }: *) => {
    const isExperimental = useExperimental();
    const headerHeight = React.useContext(HeaderHeightContext) || 0;

    let behaviorParam;
    let keyboardVerticalOffset = isExperimental ? ExperimentalHeaderHeight : 0;
    if (Platform.OS === "ios") {
      keyboardVerticalOffset += DeviceInfo.isIPhoneX_deprecated ? 88 : 64;
      behaviorParam = behavior || "height";
    }

    return (
      <KeyboardAvoidingView
        style={style}
        keyboardVerticalOffset={
          headerHeight + StatusBar.currentHeight + keyboardVerticalOffset
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
