import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import DRepImage from "../VoteDelegationFlow/DRepImage";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";

type Props = {
  dRepHex: string;
  onPress: (dRepHex: string) => void;
  isLast?: boolean;
};

export default function VoteDelegationRow({ dRepHex, onPress, isLast = false }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={() => onPress(dRepHex)}
    >
      <View style={[styles.icon]}>
        <DRepImage size={42} name={dRepHex} />
      </View>

      <View style={styles.nameWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
          {dRepHex === "2"
            ? t("cardano.voteDelegation.options.alwaysAbstain")
            : dRepHex === "3"
            ? t("cardano.voteDelegation.options.alwaysNoConfidence")
            : dRepHex}
        </Text>

        <View style={styles.row}>
          <LText style={styles.seeMore} color="live">
            {t("common.seeMore")}
          </LText>
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
    alignItems: "center",
  },
  seeMore: {
    fontSize: 14,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 5,
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
});
