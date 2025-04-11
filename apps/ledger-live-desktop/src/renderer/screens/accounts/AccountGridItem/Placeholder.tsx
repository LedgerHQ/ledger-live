import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Image from "~/renderer/components/Image";
import lightEmptyAccountTile from "~/renderer/images/light-empty-account-tile.svg";
import darkEmptyAccountTile from "~/renderer/images/dark-empty-account-tile.svg";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer/enums";

const Wrapper = styled(Box).attrs(() => ({
  p: 4,
  flex: 1,
  alignItems: "center",
}))`
  border: 1px dashed ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  height: 215px;
`;
const Placeholder = () => {
  const { t } = useTranslation();
  const { openAssetFlow } = useOpenAssetFlow(ModularDrawerLocation.ADD_ACCOUNT);
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
          color="palette.text.shade60"
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
