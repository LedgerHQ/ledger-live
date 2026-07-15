import React, { useCallback } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import SafeAreaView from "~/components/SafeAreaView";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import Button from "~/components/wrappedUi/Button";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { Trans, useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import type { AleoViewKeyFlowParamList } from "./types";
import QuitConfirmationModal from "./QuitConfirmationModal";
import useQuitConfirmation from "./useQuitConfirmation";
import { TrackScreen } from "~/analytics";

type Props = StackNavigatorProps<AleoViewKeyFlowParamList, ScreenName.AleoViewKeyWarning>;

const bulletPointTranslationKeys = [
  "aleo.addAccount.stepViewKeyWarning.bullets.0",
  "aleo.addAccount.stepViewKeyWarning.bullets.1",
  "aleo.addAccount.stepViewKeyWarning.bullets.2",
  "aleo.addAccount.stepViewKeyWarning.bullets.3",
  "aleo.addAccount.stepViewKeyWarning.bullets.4",
];

export default function ViewKeyWarningScreen() {
  const navigation = useNavigation<Props["navigation"]>();
  const route = useRoute<Props["route"]>();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { onCloseNavigation } = route.params;
  const learnMoreUrl = useLocalizedUrl(urls.aleo.learnMore);
  const quitConfirmation = useQuitConfirmation({ onCloseNavigation });

  const onContinue = useCallback(() => {
    navigation.getParent()?.navigate(ScreenName.ScanDeviceAccounts, {
      ...route.params,
      onCloseNavigation,
    });
  }, [navigation, onCloseNavigation, route.params]);

  return (
    <SafeAreaView
      edges={["bottom"]}
      testID="aleo-view-key-warning-screen"
      style={[styles.root, { backgroundColor: colors.background.main }]}
    >
      <TrackScreen category="AleoAddAccountFlow" name="View key warning" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.opacityDefault.c05 }]}>
          <LText semiBold style={styles.title} color="neutral.c100">
            <Trans i18nKey="aleo.addAccount.stepViewKeyWarning.title" />
          </LText>
          <LText secondary style={styles.description} color="neutral.c80">
            <Trans i18nKey="aleo.addAccount.stepViewKeyWarning.description">
              <LText
                onPress={() => Linking.openURL(learnMoreUrl)}
                accessibilityRole="link"
                color="primary.c80"
              />
            </Trans>
          </LText>
          <View style={styles.bullets}>
            {bulletPointTranslationKeys.map(i18nKey => (
              <View key={i18nKey} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: colors.neutral.c80 }]} />
                <LText secondary style={styles.bullet} color="neutral.c100">
                  <Trans i18nKey={i18nKey} />
                </LText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          type="main"
          onPress={onContinue}
          event="AleoAddAccountViewKeyWarningContinue"
          buttonTestId="aleo-view-key-warning-allow-button"
        >
          {t("aleo.addAccount.stepViewKeyWarning.cta.allow")}
        </Button>
        <Button
          type="main"
          outline
          mt={4}
          onPress={quitConfirmation.open}
          event="AleoAddAccountViewKeyWarningCancel"
        >
          {t("aleo.addAccount.stepViewKeyWarning.cta.cancel")}
        </Button>
      </View>
      <QuitConfirmationModal
        isOpened={quitConfirmation.isOpened}
        onClose={quitConfirmation.close}
        onConfirm={quitConfirmation.confirm}
        onModalHide={quitConfirmation.onModalHide}
      />
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
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    rowGap: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
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
