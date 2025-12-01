import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Icons, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import Button from "~/renderer/components/Button";

const BannerContainer = styled(Flex)`
  background-color: ${p => p.theme.colors.background.card};
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  gap: 12px;
  margin-bottom: 9px;
`;

const OuterIconContainer = styled(Flex)`
  position: relative;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
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

export function LedgerSyncBannerSetting({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <BannerContainer>
      <OuterIconContainer>
        <Icons.Refresh size="M" color="neutral.c80" />
        <RedDot />
      </OuterIconContainer>
      <ContentContainer>
        <Text variant="h4Inter" fontSize={16} fontWeight="600" color="neutral.c100">
          {t("walletSync.title")}
        </Text>
        <Text variant="small" fontSize={13} fontWeight="500" color="neutral.c70">
          {t("walletSync.banner.description")}
        </Text>
      </ContentContainer>
      <Button primary outline={false} onClick={onPress}>
        {t("walletSync.banner.cta")}
      </Button>
    </BannerContainer>
  );
}

export default LedgerSyncBannerSetting;
