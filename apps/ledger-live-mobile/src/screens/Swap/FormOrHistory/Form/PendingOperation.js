// @flow
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";

import { ScreenName } from "../../../../const";
import LText from "../../../../components/LText";
import Alert from "../../../../components/Alert";
import Button from "../../../../components/Button";
import IconCheck from "../../../../icons/Check";
import IconClock from "../../../../icons/Clock";
import { rgba } from "../../../../colors";

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
          <LText style={styles.description} color="grey">
            <Trans
              i18nKey={"transfer.swap.pendingOperation.description"}
              values={{ targetCurrency }}
            />
          </LText>
        </View>

        <View style={styles.disclaimer}>
          <Alert
            type="help"
            vertical
            bottom={
              <LText
                selectable
                semiBold
                style={[styles.swapID, { backgroundColor: colors.lightFog }]}
              >
                {swapId}
              </LText>
            }
          >
            <Trans
              i18nKey={"transfer.swap.pendingOperation.disclaimer"}
              values={{ provider }}
            />
          </Alert>
        </View>
      </View>
      <View style={styles.continueWrapper}>
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
  disclaimer: {
    marginTop: "auto",
    marginBottom: 32,
  },
  swapIDWrapper: {
    backgroundColor: "red",
    flexGrow: 0,
  },
  swapLabel: {
    fontSize: 14,
    lineHeight: 19,
  },
  swapID: {
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "center",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 16,
  },
  continueWrapper: {},
});

export default PendingOperation;
