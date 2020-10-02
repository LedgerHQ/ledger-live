// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import IconAD from "react-native-vector-icons/dist/AntDesign";
import IconSwap from "../../icons/Swap";
import colors, { rgba } from "../../colors";

export const getStatusColor = (status: string) => {
  return (
    {
      sending: colors.green,
      finished: colors.green,
      new: colors.grey,
      failed: colors.alert,
    }[status] || colors.grey
  );
};

const SwapStatusIndicator = ({
  status,
  small,
}: {
  status: string,
  small?: boolean,
}) => {
  const statusColor = getStatusColor(status);
  const showPendingIcon = status.endsWith("ing");
  const sizeDependantStyles = {
    backgroundColor: rgba(statusColor, 0.1),
    width: small ? 38 : 54,
    height: small ? 38 : 54,
  };

  return (
    <View style={[styles.status, sizeDependantStyles]}>
      <IconSwap color={statusColor} size={small ? 16 : 26} />
      {showPendingIcon ? (
        <View style={styles.pending}>
          <IconAD
            size={small ? 10 : 14}
            name="clockcircleo"
            color={rgba(colors.darkBlue, 0.5)}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  status: {
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pending: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    borderRadius: 12,
  },
});

export default SwapStatusIndicator;
