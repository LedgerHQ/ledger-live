import {
  isSwapOperationPending,
  operationStatusList,
} from "@ledgerhq/live-common/exchange/swap/index";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import IconAD from "react-native-vector-icons/dist/AntDesign";
import { rgba } from "../../colors";
import IconSwap from "../../icons/Swap";

export const getStatusColor = (
  status: string,
  colors: any,
  colorKey = false,
) => {
  let key = "grey";

  if (isSwapOperationPending(status)) {
    key = status === "onhold" ? "orange" : "live";
  }

  if (operationStatusList.finishedOK.includes(status)) {
    key = "green";
  }

  if (operationStatusList.finishedKO.includes(status)) {
    key = "alert";
  }

  return colorKey ? key : colors[key];
};

const SwapStatusIndicator = ({
  status,
  small,
}: {
  status: string;
  small?: boolean;
}) => {
  const { colors } = useTheme();
  const statusColor = getStatusColor(status, colors);
  const sizeDependantStyles = {
    backgroundColor: rgba(statusColor, 0.1),
    width: small ? 38 : 54,
    height: small ? 38 : 54,
  };
  return (
    <View style={[styles.status, sizeDependantStyles]}>
      <IconSwap color={statusColor} size={small ? 16 : 26} />
      {isSwapOperationPending(status) ? (
        <View
          style={[
            styles.pending,
            {
              backgroundColor: colors.white,
              borderColor: colors.white,
            },
          ]}
        >
          <IconAD
            size={small ? 10 : 14}
            name="clockcircleo"
            color={rgba(colors.darkBlue, 0.6)}
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
    borderRadius: 12,
  },
});
export default SwapStatusIndicator;
