import { Transaction } from "@ledgerhq/live-common/lib/families/solana/types";
import { Account } from "@ledgerhq/live-common/lib/types";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
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

export default function SolanaSendRowsCustom({
  account,
  transaction,
  navigation,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { model } = transaction;
  invariant(model.kind === "transfer", "must be a transfer tx");

  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.SolanaEditMemo, {
      account,
      transaction,
    });
  }, [navigation, account, transaction]);

  return (
    <View>
      <SummaryRow title={t("send.summary.memo.title")} onPress={editMemo}>
        {model.uiState.memo ? (
          <Text
            fontWeight="semiBold"
            style={styles.tagText}
            onPress={editMemo}
            numberOfLines={1}
          >
            {model.uiState.memo}
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
