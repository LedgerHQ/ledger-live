// @flow
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import LText from "../../../components/LText";
import InfoBox from "../../../components/InfoBox";
import Button from "../../../components/Button";
import IconSwap from "../../../icons/Swap";
import colors, { rgba } from "../../../colors";

const forceInset = { bottom: "always" };

const PendingOperation = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const onComplete = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  const { swapId, provider } = route.params;

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <View style={styles.wrapper}>
        <View style={styles.iconWrapper}>
          <IconSwap color={colors.live} size={20} />
        </View>
        <LText secondary style={styles.title}>
          <Trans i18nKey={"transfer.swap.pendingOperation.title"} />
        </LText>
        <View style={styles.swapIDWrapper}>
          <LText style={styles.swapLabel}>
            <Trans i18nKey={"transfer.swap.pendingOperation.label"} />
          </LText>
          <LText selectable tertiary style={styles.swapID}>
            {swapId}
          </LText>
        </View>
        <LText style={styles.description}>
          <Trans i18nKey={"transfer.swap.pendingOperation.description"} />
        </LText>

        <InfoBox>
          <Trans
            i18nKey={"transfer.swap.pendingOperation.disclaimer"}
            values={{ provider }}
          />
        </InfoBox>
      </View>
      <View style={styles.continueWrapper}>
        <Button
          event="SwapDone"
          type="primary"
          title={<Trans i18nKey={"common.continue"} />}
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
    backgroundColor: colors.white,
  },
  iconWrapper: {
    height: 50,
    width: 50,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: rgba(colors.live, 0.1),
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
    color: colors.black,
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
    color: colors.grey,
  },
  swapID: {
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
    color: colors.darkBlue,
    backgroundColor: colors.lightFog,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.grey,
    textAlign: "center",
    marginHorizontal: 30,
    marginBottom: 16,
  },
  continueWrapper: {},
});

export default PendingOperation;
