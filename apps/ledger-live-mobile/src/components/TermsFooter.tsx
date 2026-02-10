import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { Text } from "@ledgerhq/native-ui";
import React, { useMemo } from "react";
import { Trans } from "~/context/Locale";
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
const NEAR_INTENTS_PROVIDER = "nearintents";

const TermsFooter: React.FC<{
  provider?: TermsProviders;
  sponsored?: boolean;
}> = ({ provider, sponsored }) => {
  // Map changelly_v2 to changelly to access the correct urls
  const providerName = provider?.includes(CHANGELLY_PROVIDER) ? CHANGELLY_PROVIDER : provider;
  const providerUrls = providerName && urls.swap.providers[providerName];

  const { acceptTerms, urlsArray } = useMemo(() => {
    const isChangelly = providerName === CHANGELLY_PROVIDER;
    const isNearIntents = providerName === NEAR_INTENTS_PROVIDER;

    if (isNearIntents) {
      return {
        acceptTerms: "DeviceAction.confirmSwap.nearIntentsAcceptTerms",
        urlsArray: [providerUrls?.tos].filter(Boolean),
      };
    }
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
      {sponsored && (
        <>
          {" "}
          <Trans i18nKey="DeviceAction.confirmSwap.acceptTermsSponsored" />
        </>
      )}
    </CenteredText>
  );
};

export default TermsFooter;
