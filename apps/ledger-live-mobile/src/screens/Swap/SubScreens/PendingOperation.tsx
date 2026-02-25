import { CommonActions, useTheme } from "@react-navigation/native";
import React, { useCallback, useEffect } from "react";
import { Trans } from "~/context/Locale";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { track, TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import LText from "~/components/LText";
import { ScreenName } from "~/const";
import IconCheck from "~/icons/Check";
import IconClock from "~/icons/Clock";
import { rgba } from "../../../colors";
import { useSyncAllAccounts } from "../LiveApp/hooks/useSyncAllAccounts";
import { PendingOperationParamList } from "../types";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import { SWAP_VERSION } from "../utils";
import { NavigationHeaderCloseButton } from "~/components/NavigationHeaderCloseButton";

export function PendingOperation({ route, navigation }: PendingOperationParamList) {
  const { colors } = useTheme();
  const { swapId, provider, toCurrency, fromCurrency } = route.params.swapOperation;
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();
  const syncAccounts = useSyncAllAccounts();

  const navigateToSwapForm = useCallback(() => {
    track("button_clicked", {
      button: "SwapCloseSuccess",
      page: ScreenName.SwapPendingOperation,
      swapVersion: SWAP_VERSION,
    });

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <NavigationHeaderCloseButton onPress={navigateToSwapForm} />,
    });
  }, [navigation, navigateToSwapForm]);

  useEffect(() => {
    syncAccounts();
    tryTriggerPushNotificationDrawerAfterAction("swap");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onComplete = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: ScreenName.SwapTab }, { name: ScreenName.SwapHistory }],
      }),
    );
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Swap Form"
        name="Confirmation Success"
        providerName={provider}
        targetCurrency={toCurrency?.id}
        sourceCurrency={fromCurrency?.id}
        avoidDuplicates={true}
      />
      <View style={styles.wrapper}>
        <View style={styles.content}>
          <View style={[styles.iconWrapper, { backgroundColor: rgba(colors.success, 0.1) }]}>
            <IconCheck color={colors.success} size={20} />
            <View style={[styles.wrapperClock, { backgroundColor: colors.background }]}>
              <IconClock color={colors.grey} size={14} />
            </View>
          </View>
          <LText secondary style={styles.title} testID="swap-success-title">
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
            {toCurrency ? (
              <Trans
                i18nKey={"transfer.swap.pendingOperation.description"}
                values={{ targetCurrency: toCurrency.name }}
              />
            ) : null}
          </LText>
        </View>
      </View>
      <View>
        <Button
          event="SwapDone"
          type="primary"
          title={<Trans i18nKey={"transfer.swap.history.button"} />}
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
