import React, { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";

const SWAPKIT_TERMS_URL = "https://swapkit.dev/terms-of-service/";

export function PerpsDepositSignTerms() {
  const openTerms = useCallback(() => {
    Linking.openURL(SWAPKIT_TERMS_URL);
  }, []);

  return (
    <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
      <Trans
        i18nKey="perpsDepositSign.terms"
        components={{
          termsLink: (
            <Text
              typography="body4"
              lx={{ color: "muted" }}
              style={styles.link}
              onPress={openTerms}
              accessibilityRole="link"
            />
          ),
        }}
      />
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
  },
});
