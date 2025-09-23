import { Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import styled from "styled-components/native";
import { urls } from "~/utils/urls";

const CenteredText = styled(Text).attrs({
  fontWeight: "medium",
  textAlign: "center",
  fontSize: "12px",
  color: "neutral.c60",
})``;

const UnderlinedText = styled(Text).attrs({
  fontSize: "12px",
  color: "neutral.c60",
})`
  text-decoration-line: underline;
`;

export type TermsProviders = keyof typeof urls.swap.providers;

const TermsFooter: React.FC<{
  provider?: TermsProviders;
}> = ({ provider }) => {
  // Map provider variants (e.g., changelly_v2) to base provider name
  const providerName = provider?.includes("changelly") ? "changelly" : provider;
  const providerUrls = provider && providerName && urls.swap.providers[providerName];

  const { acceptTerms, urlsArray } = useMemo(() => {
    //we need to check if the provider is changelly
    //This helps to display specific message and urls for changelly
    const isProviderChangelly = provider?.includes("changelly");

    if (isProviderChangelly) {
      return {
        acceptTerms: "DeviceAction.confirmSwap.changellySimplifiedAcceptTerms",
        urlsArray: [
          providerUrls?.tos,
          providerName === "changelly" && providerUrls && "amlKyc" in providerUrls
            ? providerUrls.amlKyc
            : undefined,
          providerUrls?.support,
        ].filter(Boolean),
      };
    }

    return {
      acceptTerms: "DeviceAction.confirmSwap.acceptTerms",
      urlsArray: [providerUrls?.tos].filter(Boolean),
    };
  }, [provider, providerUrls, providerName]);

  if (!urlsArray.length) {
    return null;
  }

  return (
    <CenteredText marginTop={16}>
      <Trans
        i18nKey={acceptTerms}
        values={{ provider }}
        components={urlsArray.map((url, idx) => (
          <UnderlinedText
            onPress={() => url && Linking.openURL(url)}
            textAlign="center"
            key={`external-link-${idx}`}
          />
        ))}
      />
    </CenteredText>
  );
};

export default TermsFooter;
