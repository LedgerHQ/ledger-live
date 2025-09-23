import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
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
  const isDetailedViewEnabled = useFeature("ptxSwapconfirmSwapOnDevice");
  const providerName = provider?.includes("changelly") ? "changelly" : provider;
  const url = provider && providerName && urls.swap.providers[providerName]?.tos;
  const onLinkClick = useCallback(() => {
    if (url) {
      Linking.openURL(url);
    }
  }, [url]);

  if (!url) {
    return null;
  }
  const translationKey =
    isDetailedViewEnabled?.enabled && provider.includes("changelly")
      ? "DeviceAction.confirmSwap.changellySimplifiedAcceptTerms"
      : "DeviceAction.confirmSwap.acceptTerms";

  return (
    <CenteredText marginTop={16}>
      <Trans
        i18nKey={translationKey}
        values={{ provider }}
        components={[
          <UnderlinedText onPress={onLinkClick} textAlign="center" key="ProviderText">
            <Text
              textTransform="capitalize"
              textAlign="center"
              fontSize="paragraph"
              color="neutral.c60"
            >
              {provider}
            </Text>
          </UnderlinedText>,
        ]}
      />
    </CenteredText>
  );
};

export default TermsFooter;
