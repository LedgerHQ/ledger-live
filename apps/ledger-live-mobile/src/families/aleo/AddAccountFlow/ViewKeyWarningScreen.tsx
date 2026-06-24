import React, { useCallback } from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import Button from "~/components/wrappedUi/Button";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Trans, useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import type { AleoViewKeyFlowParamList } from "./types";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoViewKeyWarning>;

const bulletPointTranslationKeys = [
  "aleo.addAccount.stepViewKeyWarning.bullets.0",
  "aleo.addAccount.stepViewKeyWarning.bullets.1",
  "aleo.addAccount.stepViewKeyWarning.bullets.2",
  "aleo.addAccount.stepViewKeyWarning.bullets.3",
  "aleo.addAccount.stepViewKeyWarning.bullets.4",
];

export default function ViewKeyWarningScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const onContinue = useCallback(() => {
    const {
      currency,
      device,
      context,
      onCloseNavigation,
      navigationDepth,
      inline,
      returnToSwap,
      onSuccess,
    } = route.params;

    navigation.getParent()?.navigate(ScreenName.ScanDeviceAccounts, {
      currency,
      device,
      context,
      onCloseNavigation,
      navigationDepth,
      inline,
      returnToSwap,
      onSuccess,
    });
  }, [navigation, route.params]);

  const onCancel = useCallback(() => {
    navigation.getParent()?.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background.main }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <LText semiBold style={styles.title} color="neutral.c100">
          <Trans i18nKey="aleo.addAccount.stepViewKeyWarning.title" />
        </LText>
        <LText secondary style={styles.description} color="neutral.c70">
          <Trans i18nKey="aleo.addAccount.stepViewKeyWarning.description">
            <LText onPress={() => Linking.openURL(urls.aleo.learnMore)} color="primary.c80" />
          </Trans>
        </LText>
        <View style={styles.bullets}>
          {bulletPointTranslationKeys.map(i18nKey => (
            <View key={i18nKey} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.neutral.c70 }]} />
              <LText secondary style={styles.bullet} color="neutral.c70">
                <Trans i18nKey={i18nKey} />
              </LText>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button type="main" onPress={onContinue} event="AleoAddAccountViewKeyWarningContinue">
          {t("aleo.addAccount.stepViewKeyWarning.cta.allow")}
        </Button>
        <Button
          type="main"
          outline
          mt={4}
          onPress={onCancel}
          event="AleoAddAccountViewKeyWarningCancel"
        >
          {t("aleo.addAccount.stepViewKeyWarning.cta.cancel")}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    rowGap: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "left",
  },
  bullets: {
    rowGap: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 10,
  },
  bulletDot: {
    marginTop: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    padding: 16,
  },
});
