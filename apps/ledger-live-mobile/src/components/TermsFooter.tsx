import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { Text } from "@ledgerhq/native-ui";
import React from "react";
import { Trans } from "~/context/Locale";
import { Linking } from "react-native";
import styled from "styled-components/native";
import { getSwapTermsCopy, type SwapTermsProvider } from "LLM/utils/getSwapTermsCopy";

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

export type TermsProviders = SwapTermsProvider;

const TermsFooter: React.FC<{
  provider?: TermsProviders;
  sponsored?: boolean;
}> = ({ provider, sponsored }) => {
  if (!provider) {
    return null;
  }

  const { providerName, acceptTerms, links } = getSwapTermsCopy(provider);
  if (!links.length) {
    return null;
  }

  return (
    <CenteredText>
      <Trans
        i18nKey={acceptTerms}
        values={{ provider: getProviderName(providerName) }}
        components={links.map((url, idx) => (
          <UnderlinedText
            onPress={() => Linking.openURL(url)}
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
