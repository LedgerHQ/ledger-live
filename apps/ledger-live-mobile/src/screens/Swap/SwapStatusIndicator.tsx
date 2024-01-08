import {
  isSwapOperationPending,
  operationStatusList,
} from "@ledgerhq/live-common/exchange/swap/index";
import { Icon } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { rgba, Theme } from "../../colors";
import { SwapIcon } from "~/icons/swap/index";

export const getStatusColor = (status: string, colors: Theme["colors"], colorKey = false) => {
  let key: keyof Theme["colors"] = "grey";

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

export function SwapStatusIndicator({ status, small }: { status: string; small?: boolean }) {
  const { colors } = useTheme();
  const statusColor = getStatusColor(status, colors);
  const sizeDependantStyles = {
    backgroundColor: rgba(statusColor, 0.1),
    width: small ? 38 : 54,
    height: small ? 38 : 54,
  };

  return (
    <View style={[styles.status, sizeDependantStyles]}>
      <SwapIcon color={statusColor} size={small ? 16 : 26} />
      {isSwapOperationPending(status) && (
        <View
          style={[
            styles.pending,
            {
              backgroundColor: colors.white,
              borderColor: colors.white,
            },
          ]}
        >
          <Icon name="Clock" size={small ? 10 : 14} color="primary.c70" />
        </View>
      )}
    </View>
  );
}

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
