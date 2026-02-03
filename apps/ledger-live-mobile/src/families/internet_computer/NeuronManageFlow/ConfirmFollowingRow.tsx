import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { secondsToDurationString } from "@ledgerhq/live-common/families/internet_computer/utils";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Circle from "~/components/Circle";
import LText from "~/components/LText";
import ArrowRight from "~/icons/ArrowRight";
import { rgba } from "../../../colors";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

type Props = {
  neuron: ICPNeuron;
  secondsTillExpires: number;
  onConfirm: () => void;
  isLast?: boolean;
};

export default function ConfirmFollowingRow({
  neuron,
  secondsTillExpires,
  onConfirm,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const neuronId = neuron.id?.[0]?.id?.toString() || "-";
  const isUrgent = secondsTillExpires < 7 * 24 * 60 * 60; // Less than 7 days
  const isInactive = secondsTillExpires <= 0;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={onConfirm}
    >
      <View style={styles.icon}>
        <Circle size={42} bg={rgba(colors.primary, 0.2)}>
          <LText semiBold style={{ fontSize: 16, color: colors.primary }}>
            N
          </LText>
        </Circle>
      </View>

      <View style={styles.nameWrapper}>
        <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
          {formatAddress(neuronId)}
        </Text>
        <Text
          variant="small"
          fontWeight="medium"
          color={isInactive ? "error.c50" : isUrgent ? "warning.c50" : "neutral.c70"}
        >
          {secondsTillExpires > 0
            ? secondsToDurationString(secondsTillExpires.toString())
            : t("icp.neuronManage.confirmFollowing.inactiveNeuron")}
        </Text>
      </View>

      <View style={styles.rightWrapper}>
        <View style={styles.row}>
          <Text variant="small" color="live">
            <Trans i18nKey="icp.neuronManage.confirmFollowing.confirmButton" />
          </Text>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
});
