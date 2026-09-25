import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Text } from "@ledgerhq/native-ui";
import DRepImage from "../VoteDelegationFlow/DRepImage";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import { getBech32DRepId } from "@ledgerhq/live-common/families/cardano/logic";

import { CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";

type Props = {
  delegation: CardanoDelegation;
  currencyId: string;
  onPress: (dRepHex: string) => void;
  isLast?: boolean;
};

export default function VoteDelegationRow({
  delegation,
  currencyId,
  onPress,
  isLast = false,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  let name = "";
  if (delegation && delegation.dRepHex) {
    if (delegation.dRepName) {
      name = delegation.dRepName;
    } else if (delegation.dRepHex === "2") {
      name = t("cardano.voteDelegation.options.alwaysAbstain");
    } else if (delegation.dRepHex === "3") {
      name = t("cardano.voteDelegation.options.alwaysNoConfidence");
    } else {
      name = getBech32DRepId(delegation.dRepHex, currencyId);
    }
  }

  const avatarLabel =
    delegation.dRepName || (delegation.dRepHex === "2" || delegation.dRepHex === "3"
      ? delegation.dRepHex
      : getBech32DRepId(delegation.dRepHex || "", currencyId));

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={() => delegation.dRepHex && onPress(delegation.dRepHex)}
    >
      <View style={[styles.icon]}>
        <DRepImage size={42} name={avatarLabel} />
      </View>

      <View style={styles.nameWrapper}>
        <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
          {name}
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
