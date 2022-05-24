import { Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import React from "react";

const ValidatorHead = ({ title }: { title?: string }) => {
  return (
    <View style={styles.validatorHead}>
      <Text
        style={styles.validatorHeadText}
        color="smoke"
        numberOfLines={1}
        fontWeight="semiBold"
      >
        {title ?? <Trans i18nKey="delegation.validator" />}
      </Text>
      <View style={styles.validatorHeadContainer}>
        <Text
          style={styles.validatorHeadText}
          color="smoke"
          numberOfLines={1}
          fontWeight="semiBold"
        >
          <Trans i18nKey="cosmos.delegation.totalStake" />
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  validatorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validatorHeadText: {
    fontSize: 14,
  },
  validatorHeadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  validatorHeadInfo: {
    marginLeft: 5,
  },
});

export default ValidatorHead;
