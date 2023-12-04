import {
  isSwapOperationPending,
  operationStatusList,
} from "@ledgerhq/live-common/exchange/swap/index";
import { Icon } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { rgba, Theme } from "../../colors";
import { SwapIcon } from "../../icons/swap/index";

export const getStatusColor = (status: string, colors: Theme["colors"]) => {
  let color = colors.neutral.c60;

  if (isSwapOperationPending(status)) {
    color = status === "onhold" ? colors.warning.c60 : colors.primary.c70;
  }

  if (operationStatusList.finishedOK.includes(status)) {
    color = colors.success.c60;
  }

  if (operationStatusList.finishedKO.includes(status)) {
    color = colors.error.c60;
  }

  return color;
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
              backgroundColor: colors.neutral.c20,
              borderColor: colors.neutral.c20,
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
