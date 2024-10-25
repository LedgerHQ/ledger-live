import React, { useCallback } from "react";
import { ErrorBody } from "../ErrorBody";
import { Wrapper } from "./rendering";
import { Trans } from "react-i18next";
import { Link, Text } from "@ledgerhq/react-ui";
import styled, { useTheme } from "styled-components";
import Box from "../Box";
import { Icons } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";
import { CircleWrapper } from "../CryptoCurrencyIcon";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";

const CtaContainer = styled(Box)`
  margin-top: 32px;
`;

const StyledLinkExploreButton = styled(Link)`
  display: flex;
  width: 100%;
  height: 48px;
  padding: 8px 24px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 500px;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  color: ${({ theme }) => theme.colors.neutral.c00};
  background-color: ${({ theme }) => theme.colors.neutral.c100};
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral.c90};
  }
`;

const StyledLinkLearnMoreButton = styled(Link)`
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.c70};
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`;

const NoSuchAppOnProviderErrorComponent: React.FC<{
  error: Error;
  productName: string;
}> = ({ error, productName }) => {
  const theme = useTheme();

  const handleOnOpenExternalLink = useCallback(
    (url: string, trackEvent?: string, trackPayload?: Record<string, unknown>) => () => {
      openURL(url);
      if (trackEvent && trackPayload) {
        track(trackEvent, trackPayload);
      }
    },
    [],
  );

  const renderExploreIcon = () => <Icons.ExternalLink size="S" />;

  return (
    <Wrapper id="error-NoSuchAppOnProvider">
      <ErrorBody
        top={
          <CircleWrapper color={theme.colors.palette.opacityDefault.c05} size={72}>
            <Icons.DeleteCircleFill size="L" color="error.c50" />
          </CircleWrapper>
        }
        title={
          <Trans
            i18nKey="errors.NoSuchAppOnProvider.title"
            values={{ productName, appName: (error as Error & { appName: string })?.appName }}
          />
        }
        description={
          <Trans i18nKey="errors.NoSuchAppOnProvider.description" color="neutral.c100">
            <Text color="neutral.c100" fontWeight="700"></Text>
          </Trans>
        }
      />

      <CtaContainer>
        <StyledLinkExploreButton
          onClick={handleOnOpenExternalLink(urls.ledgerShop, "button_clicked", {
            button: "Explore more compatible devices |  page: NanoS connection LS",
          })}
        >
          <Trans i18nKey="errors.NoSuchAppOnProvider.exploreCTA" />
        </StyledLinkExploreButton>
        <StyledLinkLearnMoreButton
          onClick={handleOnOpenExternalLink(urls.learnMoreLedgerSync)}
          Icon={renderExploreIcon}
        >
          <Trans i18nKey="errors.NoSuchAppOnProvider.learnMoreCTA" />
        </StyledLinkLearnMoreButton>
      </CtaContainer>
    </Wrapper>
  );
};

export default NoSuchAppOnProviderErrorComponent;
