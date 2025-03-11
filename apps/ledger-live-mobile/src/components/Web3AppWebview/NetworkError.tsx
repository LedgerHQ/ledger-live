import React from "react";
import { Linking } from "react-native";
import { createCustomErrorClass } from "@ledgerhq/errors";
import { Trans } from "react-i18next";
import styled from "styled-components/native";
import { Flex, IconsLegacy } from "@ledgerhq/native-ui";
import GenericErrorView from "../GenericErrorView";
import Button from "../Button";
import ExternalLink from "../ExternalLink";
import { useLocale } from "~/context/Locale";
import { urls } from "~/utils/urls";

const WebPTXPlayerNetworkFail = createCustomErrorClass("WebPTXPlayerNetworkFail");

const ExternalLinkWrapper = styled.View`
  margin-top: 19px;
`;

export const NetworkError = ({ handleTryAgain }: { handleTryAgain: () => void }) => {
  const { locale } = useLocale();

  return (
    <Flex flex={1} justifyContent="center">
      <GenericErrorView
        exportLogIcon={IconsLegacy.ImportMedium}
        exportLogIconPosition="right"
        error={new WebPTXPlayerNetworkFail()}
        footerComponent={
          <ExternalLinkWrapper>
            <ExternalLink
              onPress={() =>
                Linking.openURL(
                  urls.contactSupportWebview[locale as keyof typeof urls.contactSupportWebview] ??
                    urls.contactSupportWebview.en,
                )
              }
              text={<Trans i18nKey="errors.WebPTXPlayerNetworkFail.contactSupport" />}
              type="main"
            />
          </ExternalLinkWrapper>
        }
      >
        <Button
          paddingX={40}
          marginTop={24}
          type="main"
          outline={false}
          event="button_clicked"
          eventProperties={{
            button: "Contact Ledger Support",
          }}
          onPress={handleTryAgain}
          minWidth="143px"
          height="40px"
        >
          <Trans marginWidth={40} i18nKey="errors.WebPTXPlayerNetworkFail.primaryCTA" />
        </Button>
      </GenericErrorView>
    </Flex>
  );
};
