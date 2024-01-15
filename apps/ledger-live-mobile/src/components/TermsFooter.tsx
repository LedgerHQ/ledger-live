import { Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import styled from "styled-components/native";
import { urls } from "~/utils/urls";

const CenteredText = styled(Text).attrs({
  fontWeight: "medium",
  textAlign: "center",
})``;

const UnderlinedText = styled(Text)`
  text-decoration-line: underline;
`;

export type TermsProviders = keyof typeof urls.swap.providers;

const TermsFooter: React.FC<{
  provider?: TermsProviders;
}> = ({ provider }) => {
  const url = provider && urls.swap.providers[provider]?.tos;
  const onLinkClick = useCallback(() => {
    if (url) {
      Linking.openURL(url);
    }
  }, [url]);

  if (!url) {
    return null;
  }

  return (
    <CenteredText>
      <Trans
        i18nKey="DeviceAction.confirmSwap.acceptTerms"
        values={{ provider }}
        components={[
          <UnderlinedText onPress={onLinkClick} textAlign="center" key="ProviderText">
            <Text textTransform="capitalize" textAlign="center">
              {provider}
            </Text>
          </UnderlinedText>,
        ]}
      />
    </CenteredText>
  );
};

export default TermsFooter;
