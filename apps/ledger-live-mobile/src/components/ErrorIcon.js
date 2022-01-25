// @flow
import React from "react";
import { StyleSheet } from "react-native";
import IconAD from "react-native-vector-icons/dist/AntDesign";
import {
  CantOpenDevice,
  WrongDeviceForAccount,
  PairingFailed,
  UserRefusedAllowManager,
} from "@ledgerhq/errors";
import { SwapGenericAPIError } from "@ledgerhq/live-common/lib/errors";
import { useTheme } from "@react-navigation/native";
import Rounded from "./Rounded";
import IconNanoX from "../icons/NanoX";
import Close from "../icons/Close";
import ErrorBadge from "./ErrorBadge";
import Circle from "./Circle";
import { rgba } from "../colors";
import BluetoothScanning from "./BluetoothScanning";
import ErrorCrossBadge from "./ErrorCrossBadge";

type Props = {
  error: ?Error,
};

export default function ErrorIcon({ error }: Props) {
  const { colors } = useTheme();
  if (!error) return null;
  if (typeof error !== "object") {
    // this case should not happen (it is supposed to be a ?Error)
    console.error(`ErrorIcon invalid usage: ${String(error)}`);
    return null;
  }

  if (error instanceof UserRefusedAllowManager) {
    return (
      <Rounded bg={colors.pillActiveBackground}>
        <IconNanoX color={colors.live} height={36} width={8} />
        <ErrorCrossBadge style={styles.badge} />
      </Rounded>
    );
  }

  if (error instanceof PairingFailed) {
    return <BluetoothScanning isError />;
  }

  if (
    error instanceof CantOpenDevice ||
    error instanceof WrongDeviceForAccount
  ) {
    return (
      <Rounded bg={rgba(colors.alert, 0.15)}>
        <IconNanoX color={colors.alert} height={36} width={8} />
        <ErrorBadge style={styles.badge} />
      </Rounded>
    );
  }

  if (error instanceof SwapGenericAPIError) {
    return (
      <Circle size={80} bg={rgba(colors.darkBlue, 0.05)}>
        <IconAD
          size={40}
          name="clockcircleo"
          color={rgba(colors.darkBlue, 0.5)}
        />
      </Circle>
    );
  }
  return (
    <Circle size={80} bg={rgba(colors.alert, 0.15)}>
      <Close size={40} color={colors.alert} />
    </Circle>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    width: 32,
    height: 32,
  },
});
