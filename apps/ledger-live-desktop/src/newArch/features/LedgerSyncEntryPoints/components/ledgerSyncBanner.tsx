import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import Illustration from "~/renderer/components/Illustration";
import LogoDark from "LLD/features/LedgerSyncEntryPoints/assets/logo_dark.svg";
import LogoLight from "LLD/features/LedgerSyncEntryPoints/assets/logo_light.svg";

const BannerContainer = styled(Flex)`
  background-color: ${p => p.theme.colors.background.card};
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  gap: 12px;
  margin-bottom: 9px;
`;

const IllustrationContainer = styled(Flex)`
  position: relative;
`;

const RedDot = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${p => p.theme.colors.error.c50};
  border: 2px solid ${p => p.theme.colors.background.card};
`;

const ContentContainer = styled(Flex)`
  flex-direction: column;
  flex: 1;
`;

export function LedgerSyncBanner({ onPress }: Readonly<{ onPress: () => void }>) {
  const { t } = useTranslation();

  return (
    <BannerContainer>
      <IllustrationContainer>
        <Illustration lightSource={LogoLight} darkSource={LogoDark} size={48} />
        <RedDot />
      </IllustrationContainer>
      <ContentContainer>
        <Text variant="h4Inter" fontSize={16} fontWeight="600" color="neutral.c100">
          {t("walletSync.banner.title")}
        </Text>
        <Text variant="small" fontSize={13} fontWeight="500" color="neutral.c70">
          {t("walletSync.banner.description")}
        </Text>
      </ContentContainer>
      <Button variant="main" outline={false} onClick={onPress}>
        {t("walletSync.banner.cta")}
      </Button>
    </BannerContainer>
  );
}

export default LedgerSyncBanner;
