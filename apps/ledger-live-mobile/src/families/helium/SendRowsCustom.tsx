import { Transaction } from "@ledgerhq/live-common/families/helium/types";
import { Account } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: Account;
  transaction: Transaction;
  navigation: any;
};

export default function HeliumSendRowsCustom({
  account,
  transaction,
  navigation,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { model } = transaction;

  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.HeliumEditMemo, {
      account,
      transaction,
    });
  }, [navigation, account, transaction]);

  return (
    <View>
      <SummaryRow title={t("send.summary.memo.title")} onPress={editMemo}>
        {model.memo ? (
          <Text
            fontWeight="semiBold"
            style={styles.tagText}
            onPress={editMemo}
            numberOfLines={1}
          >
            {model.memo}
          </Text>
        ) : (
          <Text
            style={[
              styles.link,
              {
                textDecorationColor: colors.live,
              },
            ]}
            color="live"
            onPress={editMemo}
          >
            {t("common.edit")}
          </Text>
        )}
      </SummaryRow>
    </View>
  );
}

const styles = StyleSheet.create({
  memoContainer: {
    flexDirection: "row",
  },
  tagText: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  link: {
    textDecorationStyle: "solid",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  memo: {
    marginBottom: 10,
  },
});
