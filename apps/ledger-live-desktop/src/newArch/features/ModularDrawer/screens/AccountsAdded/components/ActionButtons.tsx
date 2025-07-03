import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, Flex } from "@ledgerhq/react-ui";
import { FOOTER_PADDING_BOTTOM_PX, FOOTER_PADDING_TOP_PX } from "../../styles";

interface Props {
  onAddFunds: () => void;
  onClose: () => void;
  isAccountSelectionFlow: boolean;
}

export const ActionButtons = ({ onAddFunds, onClose, isAccountSelectionFlow }: Props) => {
  const { t } = useTranslation();

  return (
    <Box paddingBottom={FOOTER_PADDING_BOTTOM_PX} paddingTop={FOOTER_PADDING_TOP_PX} zIndex={1}>
      <Flex flexDirection="column" width="100%" rowGap="3">
        <Button onClick={onAddFunds} size="large" variant="main">
          {isAccountSelectionFlow
            ? t("modularAssetDrawer.accountsAdded.cta.selectAccount")
            : t("modularAssetDrawer.accountsAdded.cta.addFunds")}
        </Button>
        {!isAccountSelectionFlow && (
          <Button onClick={onClose} size="large" variant="main" outline>
            {t("modularAssetDrawer.accountsAdded.cta.close")}
          </Button>
        )}
      </Flex>
    </Box>
  );
};
