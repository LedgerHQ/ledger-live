import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Icons, Flex, Text } from "@ledgerhq/react-ui";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import styled from "styled-components";

const BannerContainer = styled(Flex)`
  background-color: ${p => p.theme.colors.palette.background.paper};
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  gap: 12px;
  margin-bottom: 9px;
`;

const OuterIconContainer = styled(Flex)`
  position: relative;
  width: 54px;
  height: 54px;
  border-radius: 12px;
  border-top: 0.5px solid ${p => p.theme.colors.neutral.c50};
  background: linear-gradient(
    to bottom,
    ${p => p.theme.colors.neutral.c30},
    ${p => p.theme.colors.palette.background.paper}
  );
  align-items: center;
  justify-content: center;
`;

const InnerIconContainer = styled(Flex)`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background-color: ${p => p.theme.colors.pillActiveBackground};
  align-items: center;
  justify-content: center;
`;

const RedDot = styled.div`
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${p => p.theme.colors.error.c50};
  border: 2px solid ${p => p.theme.colors.palette.background.paper};
`;

const ContentContainer = styled(Flex)`
  flex-direction: column;
  flex: 1;
`;

const LedgerSyncBanner = () => {
  const { t } = useTranslation();
  const { shouldDisplayEntryPoint, onClickEntryPoint, openDrawer } =
    useLedgerSyncEntryPointViewModel({
      entryPoint: EntryPoint.accounts,
    });

  if (!shouldDisplayEntryPoint) {
    return null;
  }

  const handleSyncClick = () => {
    onClickEntryPoint();
    openDrawer();
  };

  return (
    <BannerContainer>
      <OuterIconContainer>
        <InnerIconContainer>
          <Icons.Refresh size="M" color="primary.c80" />
        </InnerIconContainer>
        <RedDot />
      </OuterIconContainer>
      <ContentContainer>
        <Text variant="h4Inter" fontSize={16} fontWeight="600" color="neutral.c100">
          {t("walletSync.banner.title")}
        </Text>
        <Text variant="small" fontSize={13} fontWeight="500" color="neutral.c70">
          {t("walletSync.banner.description")}
        </Text>
      </ContentContainer>
      <Button variant="main" outline={false} onClick={handleSyncClick}>
        {t("walletSync.banner.cta")}
      </Button>
    </BannerContainer>
  );
};

export default LedgerSyncBanner;
