// @flow
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";

import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import Button from "../../components/Button";
import IconCheck from "../../icons/Check";
import IconClock from "../../icons/Clock";
import { rgba } from "../../colors";
import { TrackScreen } from "../../analytics";

const forceInset = { bottom: "always" };

const PendingOperation = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const {
    swapId,
    provider,
    targetCurrency,
    operation,
    fromAccount,
    fromParentAccount,
  } = route.params;

  const sourceCurrency = fromAccount && getAccountCurrency(fromAccount);

  const onComplete = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, {
      accountId: fromAccount.id,
      parentId: fromParentAccount && fromParentAccount.id,
      operation,
      key: operation.id,
    });
  }, [fromAccount.id, fromParentAccount, navigation, operation]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <TrackScreen
        category="Swap Form"
        name="Confirmation Success"
        providerName={provider}
        targetCurrency={targetCurrency}
        sourceCurrency={sourceCurrency?.id}
      />
      <View style={styles.wrapper}>
        <View style={styles.content}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: rgba(colors.success, 0.1) },
            ]}
          >
            <IconCheck color={colors.success} size={20} />
            <View
              style={[
                styles.wrapperClock,
                { backgroundColor: colors.background },
              ]}
            >
              <IconClock color={colors.grey} size={14} />
            </View>
          </View>
          <LText secondary style={styles.title}>
            <Trans i18nKey={"transfer.swap.pendingOperation.title"} />
          </LText>
          <View
            style={{
              flexDirection: "row",
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            <LText style={styles.swapID} color="grey">
              <Trans i18nKey={"transfer.swap.pendingOperation.label"} />
            </LText>

            <LText
              style={[
                styles.swapID,
                {
                  backgroundColor: colors.fog,
                },
              ]}
              color="darkBlue"
            >
              {swapId}
            </LText>
          </View>
          <LText style={styles.description} color="grey">
            <Trans
              i18nKey={"transfer.swap.pendingOperation.description"}
              values={{ targetCurrency }}
            />
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
};

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
});

export default PendingOperation;
