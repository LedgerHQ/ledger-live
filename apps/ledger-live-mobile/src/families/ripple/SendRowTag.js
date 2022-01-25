/* @flow */
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans } from "react-i18next";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/ripple/types";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: Account,
  transaction: Transaction,
};

export default function RippleTagRow({ account, transaction }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const editTag = useCallback(() => {
    navigation.navigate(ScreenName.RippleEditTag, {
      accountId: account.id,
      transaction,
    });
  }, [navigation, account, transaction]);

  const tag = transaction.tag;

  return (
    <View>
      <SummaryRow title={<Trans i18nKey="send.summary.tag" />} info="info">
        <View style={styles.tagContainer}>
          {tag && <LText style={styles.tagText}>{tag.toString()}</LText>}
          <LText
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editTag}
          >
            <Trans i18nKey="common.edit" />
          </LText>
        </View>
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: "row",
  },
  tagText: {
    fontSize: 16,
  },
});
