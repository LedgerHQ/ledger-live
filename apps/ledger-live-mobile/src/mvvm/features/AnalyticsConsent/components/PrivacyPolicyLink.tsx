import React from "react";
import { StyleSheet, Text as RNText } from "react-native";
import { Trans } from "~/context/Locale";
import { Text } from "@ledgerhq/lumen-ui-rnative";

interface PrivacyPolicyLinkProps {
  onPrivacyPolicyPress: () => void;
}

const PrivacyPolicyLink = ({ onPrivacyPolicyPress }: PrivacyPolicyLinkProps) => {
  return (
    <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
      <Trans
        i18nKey="analyticsConsent.privacyPolicy"
        components={{
          PrivacyPolicy: (
            <RNText style={styles.link} onPress={onPrivacyPolicyPress} accessibilityRole="link" />
          ),
        }}
      />
    </Text>
  );
};

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
  },
});

export default PrivacyPolicyLink;
