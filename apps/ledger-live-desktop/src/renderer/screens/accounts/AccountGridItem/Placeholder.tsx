import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Image from "~/renderer/components/Image";
import lightEmptyAccountTile from "~/renderer/images/light-empty-account-tile.svg";
import darkEmptyAccountTile from "~/renderer/images/dark-empty-account-tile.svg";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";

const Wrapper = styled(Box).attrs(() => ({
  p: 4,
  flex: 1,
  alignItems: "center",
}))`
  border: 1px dashed ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
  height: 215px;
`;
const Placeholder = () => {
  const { t } = useTranslation();
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    MAD_SOURCE_PAGES.ACCOUNTS_PAGE,
  );
  return (
    <Box mb={5}>
      <Wrapper data-e2e="dashboard_AccountPlaceOrder">
        <Box mt={2}>
          <Image
            alt="empty account placeholder"
            resource={{
              light: lightEmptyAccountTile,
              dark: darkEmptyAccountTile,
            }}
            themeTyped
          />
        </Box>
        <Box
          ff="Inter"
          fontSize={3}
          color="neutral.c70"
          pb={2}
          mt={3}
          textAlign="center"
          style={{
            maxWidth: 150,
          }}
        >
          {t("dashboard.emptyAccountTile.desc")}
        </Box>
        <Button primary onClick={openAssetFlow}>
          {t("dashboard.emptyAccountTile.createAccount")}
        </Button>
      </Wrapper>
    </Box>
  );
};
export default Placeholder;
