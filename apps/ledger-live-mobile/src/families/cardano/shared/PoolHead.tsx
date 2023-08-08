import { Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import React from "react";

const PoolHead = ({ title }: { title?: string }) => {
  return (
    <View style={styles.poolHead}>
      <Text style={styles.poolHeadText} color="smoke" numberOfLines={1} fontWeight="semiBold">
        {title ?? <Trans i18nKey="cardano.delegation.pools" />}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  poolHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  poolHeadText: {
    fontSize: 14,
    marginLeft: 10,
  },
});

export default PoolHead;
