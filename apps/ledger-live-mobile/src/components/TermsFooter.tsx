import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import styled from "styled-components/native";
import { urls } from "~/utils/urls";

const CenteredText = styled(Text).attrs({
  fontWeight: "medium",
  textAlign: "center",
  variant: "small",
  color: "neutral.c60",
  marginLeft: 16,
  marginRight: 16,
})`
  overflow-wrap: break-word;
`;

const UnderlinedText = styled(Text).attrs({
  variant: "small",
  color: "neutral.c60",
})`
  text-decoration-line: underline;
`;

export type TermsProviders = keyof typeof urls.swap.providers;

const CHANGELLY_PROVIDER = "changelly";

const TermsFooter: React.FC<{
  provider?: TermsProviders;
}> = ({ provider }) => {
  // Map changelly_v2 to changelly to access the correct urls
  const providerName = provider?.includes(CHANGELLY_PROVIDER) ? CHANGELLY_PROVIDER : provider;
  const providerUrls = providerName && urls.swap.providers[providerName];

  const { acceptTerms, urlsArray } = useMemo(() => {
    //we need to check if the provider is changelly
    //This helps to display specific message and urls for changelly
    const isChangelly = providerName === CHANGELLY_PROVIDER;

    if (isChangelly) {
      return {
        acceptTerms: "DeviceAction.confirmSwap.changellySimplifiedAcceptTerms",
        urlsArray: [
          providerUrls?.tos,
          providerUrls && "amlKyc" in providerUrls ? providerUrls.amlKyc : undefined,
          providerUrls && "support" in providerUrls ? providerUrls.support : undefined,
        ].filter(Boolean),
      };
    }

    return {
      acceptTerms: "DeviceAction.confirmSwap.acceptTerms",
      urlsArray: [providerUrls?.tos].filter(Boolean),
    };
  }, [providerUrls, providerName]);

  if (!urlsArray.length) {
    return null;
  }

  return (
    <CenteredText>
      <Trans
        i18nKey={acceptTerms}
        values={{ provider: providerName && getProviderName(providerName) }}
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
