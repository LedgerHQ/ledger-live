import React, { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";

import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector } from "react-redux";
import LText from "~/components/LText";
import Button from "~/components/Button";
import IconCheck from "~/icons/Check";
import IconClock from "~/icons/Clock";
import { rgba } from "../../../colors";
import { TrackScreen } from "~/analytics";
import { PendingOperationParamList } from "../types";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { ScreenName } from "~/const";

export function PendingOperation({ route, navigation }: PendingOperationParamList) {
  const { colors } = useTheme();
  const { swapId, provider, toAccountId, fromAccountId } = route.params.swapOperation;
  const accounts = useSelector(flattenAccountsSelector);
  const fromAccount = useMemo(
    () => accounts.find(a => a.id === fromAccountId),
    [accounts, fromAccountId],
  );
  const toAccount = useMemo(
    () => accounts.find(a => a.id === toAccountId),
    [accounts, toAccountId],
  );

  const sourceCurrency = fromAccount && getAccountCurrency(fromAccount);
  const targetCurrency = toAccount && getAccountCurrency(toAccount);

  const onComplete = useCallback(() => {
    navigation.navigate(ScreenName.SwapOperationDetails, {
      swapOperation: route.params.swapOperation,
      fromPendingOperation: true,
    });
  }, [navigation, route.params.swapOperation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Swap Form"
        name="Confirmation Success"
        providerName={provider}
        targetCurrency={targetCurrency}
        sourceCurrency={sourceCurrency?.id}
      />
      <View style={styles.wrapper}>
        <View style={styles.content}>
          <View style={[styles.iconWrapper, { backgroundColor: rgba(colors.success, 0.1) }]}>
            <IconCheck color={colors.success} size={20} />
            <View style={[styles.wrapperClock, { backgroundColor: colors.background }]}>
              <IconClock color={colors.grey} size={14} />
            </View>
          </View>
          <LText secondary style={styles.title}>
            <Trans i18nKey={"transfer.swap.pendingOperation.title"} />
          </LText>
          <View style={styles.label}>
            <LText style={styles.swapID} color="grey">
              <Trans i18nKey={"transfer.swap.pendingOperation.label"} />
            </LText>

            <LText style={[styles.swapID]} color="darkBlue">
              {swapId}
            </LText>
          </View>
          <LText style={styles.description} color="grey">
            {targetCurrency ? (
              <Trans
                i18nKey={"transfer.swap.pendingOperation.description"}
                values={{ targetCurrency: targetCurrency.name }}
              />
            ) : null}
          </LText>
        </View>
      </View>
      <View>
        <Button
          event="SwapDone"
          type="primary"
          title={<Trans i18nKey={"transfer.swap.pendingOperation.cta"} />}
          onPress={onComplete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  iconWrapper: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginBottom: 16,

    alignItems: "center",
    justifyContent: "center",
  },
  wrapperClock: {
    borderRadius: 16,
    position: "absolute",
    bottom: -2,
    right: -2,
    padding: 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 16,
  },
  swapID: {
    fontSize: 13,
    padding: 4,
    borderRadius: 4,
    lineHeight: 18,
    height: 26,
    textAlign: "center",
    marginHorizontal: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginHorizontal: 30,
    marginVertical: 16,
  },
  label: {
    alignContent: "center",
    justifyContent: "center",
  },
});
