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
import IconSwap from "../../../../icons/Swap";
import { rgba } from "../../../../colors";

const forceInset = { bottom: "always" };

const PendingOperation = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const onComplete = useCallback(() => {
    navigation.navigate(ScreenName.SwapFormOrHistory, {
      screen: ScreenName.SwapHistory,
    });
  }, [navigation]);

  const { swapId, provider } = route.params;

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: rgba(colors.live, 0.1) },
          ]}
        >
          <IconSwap color={colors.live} size={20} />
        </View>
        <LText secondary style={styles.title}>
          <Trans i18nKey={"transfer.swap.pendingOperation.title"} />
        </LText>
        <View style={styles.swapIDWrapper}>
          <LText style={styles.swapLabel} color="grey">
            <Trans i18nKey={"transfer.swap.pendingOperation.label"} />
          </LText>
          <LText
            selectable
            tertiary
            style={[styles.swapID, { backgroundColor: colors.lightFog }]}
          >
            {swapId}
          </LText>
        </View>
        <LText style={styles.description} color="grey">
          <Trans i18nKey={"transfer.swap.pendingOperation.description"} />
        </LText>

        <Alert type="primary">
          <Trans
            i18nKey={"transfer.swap.pendingOperation.disclaimer"}
            values={{ provider }}
          />
        </Alert>
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
  iconWrapper: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginBottom: 16,

    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 16,
  },
  swapIDWrapper: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  swapLabel: {
    fontSize: 14,
    lineHeight: 19,
  },
  swapID: {
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
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
