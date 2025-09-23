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
  fontSize: "paragraph",
  color: "neutral.c60",
})``;

const UnderlinedText = styled(Text).attrs({
  fontSize: "paragraph",
  color: "neutral.c60",
})`
  text-decoration-line: underline;
`;

export type TermsProviders = keyof typeof urls.swap.providers;

const TermsFooter: React.FC<{
  provider?: TermsProviders;
}> = ({ provider }) => {
  const isDetailedViewEnabled = useFeature("ptxSwapconfirmSwapOnDevice");
  const url = provider && urls.swap.providers[provider]?.tos;
  const onLinkClick = useCallback(() => {
    if (url) {
      Linking.openURL(url);
    }
  }, [url]);

  if (!url) {
    return null;
  }
  const translationKey =
    isDetailedViewEnabled?.enabled && provider === "changelly"
      ? "DeviceAction.confirmSwap.acceptTermsSimplified"
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
