// @flow
import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import type { Account } from "@ledgerhq/live-common/lib/types";
import type { Transaction } from "@ledgerhq/live-common/lib/families/solana/types";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import SummaryRow from "../../screens/SendFunds/SummaryRow";

type Props = {
  account: Account,
  transaction: Transaction,
  navigation: any,
};

export default function SolanaSendRowsCustom({
  account,
  transaction,
  navigation,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const editMemo = useCallback(() => {
    navigation.navigate(ScreenName.SolanaEditMemo, {
      account,
      transaction,
    });
  }, [navigation, account, transaction]);

  return (
    <View>
      <SummaryRow title={t("send.summary.memo.title")} onPress={editMemo}>
        {transaction.model.uiState.memo ? (
          <LText
            semiBold
            style={styles.tagText}
            onPress={editMemo}
            numberOfLines={1}
          >
            {transaction.model.uiState.memo}
          </LText>
        ) : (
          <LText
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
          </LText>
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
