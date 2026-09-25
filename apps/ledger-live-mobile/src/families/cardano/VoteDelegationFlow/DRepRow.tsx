import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import Touchable from "~/components/Touchable";
import DRepImage from "./DRepImage";
import type { DRep } from "@ledgerhq/live-common/families/cardano/DRep";
import { getBech32DRepId } from "@ledgerhq/live-common/families/cardano/logic";
import { useFormatDate } from "~/hooks/useDateFormatter";
import { useTranslation } from "~/context/Locale";

const DRepRow = ({
  onPress,
  drep,
  currencyId,
}: {
  onPress: (v: DRep) => void;
  drep: DRep;
  currencyId: string;
}) => {
  const { t } = useTranslation();
  const onPressT = useCallback(() => {
    onPress(drep);
  }, [drep, onPress]);

  const formatDate = useFormatDate();
  const lastActiveOn = drep.active ? formatDate(new Date(drep.active)) : "-";
  const bech32DRepId = getBech32DRepId(drep.hex, currencyId);

  return (
    <Touchable event="DelegationFlowChoseDRep" onPress={onPressT} style={[styles.root]}>
      <DRepImage size={40} name={drep.meta?.givenName || bech32DRepId} />
      <View style={styles.content}>
        <View style={styles.nameWrapper}>
          <Text variant={"body"} fontWeight={"semiBold"} numberOfLines={1}>
            {drep.meta?.givenName || bech32DRepId}
          </Text>
        </View>
        <Text variant={"paragraph"} fontWeight={"medium"} color={"neutral.c70"}>
          {t("cardano.voteDelegation.lastActiveOn")}: {lastActiveOn}
        </Text>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  content: {
    marginLeft: 16,
    flexDirection: "column",
    flex: 1,
  },
  nameWrapper: {
    flexDirection: "row",
  },
});

export default DRepRow;
