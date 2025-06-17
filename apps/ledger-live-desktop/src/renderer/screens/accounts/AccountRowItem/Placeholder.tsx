import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer/enums";
import { useOpenAssetFlow } from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import Box from "~/renderer/components/Box";
import IconPlus from "~/renderer/icons/Plus";
import { MAD_SOURCE_PAGES } from "LLD/features/ModularDrawer/analytics/types";

const AddAccountButton = styled(Box)`
  border: 1px dashed rgba(153, 153, 153, 0.3);
  cursor: pointer;
  border-radius: 4px;
  padding: 20px;
  color: #abadb6;
  font-weight: 600;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: row;
  height: auto;

  &:hover {
    cursor: pointer;
    border-color: ${p => p.theme.colors.palette.text.shade100};
    color: ${p => p.theme.colors.palette.text.shade100};
  }
`;
const Placeholder = () => {
  const { t } = useTranslation();
  const { openAssetFlow } = useOpenAssetFlow(
    ModularDrawerLocation.ADD_ACCOUNT,
    MAD_SOURCE_PAGES.ACCOUNTS_PAGE,
  );
  const handleAddAccountClick = () => {
    openAssetFlow(true);
  };

  return (
    <Box mb={5}>
      <AddAccountButton onClick={handleAddAccountClick} pb={6}>
        <IconPlus size={16} />
        <Box ml={20} ff="Inter|Regular" fontSize={4}>
          {t("addAccounts.cta.add")}
        </Box>
      </AddAccountButton>
    </Box>
  );
};
export default React.memo<{}>(Placeholder);
