import React, { ComponentType } from "react";
import { ErrorBody } from "../ErrorBody";
import { Wrapper } from "./rendering";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/react-ui";
import ExternalLinkButton from "../ExternalLinkButton";
import styled from "styled-components";
import Box from "../Box";
import { Icons } from "@ledgerhq/react-ui";
import { urls } from "~/config/urls";

const CtaContainer = styled(Box)`
  margin-top: 32px;
`;

const StyledLinkExploreButton = styled(ExternalLinkButton)`
  display: flex;
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

const StyledLinkLearnMoreButton = styled(ExternalLinkButton)`
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
  error: (Error & { appName: string }) | null | undefined;
  Icon?: ComponentType<{ color?: string | undefined; size?: number | undefined }>;
  productName: string;
}> = ({ error, Icon, productName }) => (
  <Wrapper id="error-NoSuchAppOnProvider">
    <ErrorBody
      Icon={Icon}
      title={
        <Trans
          i18nKey="errors.NoSuchAppOnProvider.title"
          values={{ productName, appName: error?.appName }}
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
        label={<Trans i18nKey="errors.NoSuchAppOnProvider.exploreCTA" />}
        url={urls.ledgerShop}
      />
      <StyledLinkLearnMoreButton
        label={
          <>
            <Trans i18nKey="errors.NoSuchAppOnProvider.learnMoreCTA" />
            &nbsp;&nbsp;
            <Icons.ExternalLink size="S" />
          </>
        }
        url={urls.learnMoreLedgerSync}
      />
    </CtaContainer>
  </Wrapper>
);

export default NoSuchAppOnProviderErrorComponent;
