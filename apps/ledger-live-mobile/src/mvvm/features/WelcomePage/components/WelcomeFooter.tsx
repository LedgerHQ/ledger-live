import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { Button, Text as LText } from "@ledgerhq/native-ui";
import { useWelcomeNavigation } from "../hooks/useWelcomeNavigation";

/**
 * WelcomeFooter component to display the footer with a button and disclaimer text.
 * Three CTAs:
 * - Get Started (Navigate to accept terms screen)
 * - Terms and Conditions (Open link in external browser)
 * - Privacy Policy (Open link in external browser)
 * @returns React.JSX.Element
 */
export function WelcomeFooter() {
  const { t } = useTranslation();
  const { onGetStarted, onPrivacyPolicy, onTermsAndConditions } = useWelcomeNavigation();

  return (
    <View style={styles.container}>
      <Button
        type="main"
        size="large"
        style={styles.button}
        testID="onboarding-getStarted-button"
        onPress={onGetStarted}
      >
        {t("onboarding.stepWelcome.start")}
      </Button>
      <LText variant="body" color="neutral.c90" style={styles.disclaimer}>
        <Trans
          i18nKey="onboarding.stepWelcome.disclaimer"
          components={{
            TermsAndConditions: <Text style={styles.underline} onPress={onTermsAndConditions} />,
            PrivacyPolicy: <Text style={styles.underline} onPress={onPrivacyPolicy} />,
          }}
        />
      </LText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    marginTop: "auto",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0.4,
    backgroundColor: "transparent",
  },
  button: {
    marginBottom: 12,
  },
  underline: {
    textDecorationLine: "underline",
  },
});
