import React, { useCallback } from "react";
import { Linking, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { getProviderTermsOfUseUrl } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { Trans } from "~/context/Locale";
import { PERPS_DEPOSIT_PROVIDER_ID } from "LLM/features/Perps/constants/depositFunding";

export function PerpsDepositSignTerms() {
  const termsUrl = getProviderTermsOfUseUrl(PERPS_DEPOSIT_PROVIDER_ID);
  const openTerms = useCallback(() => {
    if (termsUrl) Linking.openURL(termsUrl);
  }, [termsUrl]);

  return (
    <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
      <Trans
        i18nKey="perpsDepositSign.terms"
        components={{
          termsLink: (
            <Text
              typography="body4"
              lx={{ color: "muted" }}
              style={termsUrl ? styles.link : undefined}
              onPress={termsUrl ? openTerms : undefined}
              accessibilityRole={termsUrl ? "link" : undefined}
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
