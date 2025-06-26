import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";

const GradientFlex = styled(Flex)`
  background: linear-gradient(
    180deg,
    ${p => (p.theme.colors.type === "light" ? "rgba(255, 255, 255, 0)" : "rgba(29, 28, 31, 0)")}
      0.93%,
    ${p =>
        p.theme.colors.type === "light" ? "rgba(255, 255, 255, 0.86)" : "rgba(29, 28, 31, 0.86)"}
      9.74%,
    ${p => (p.theme.colors.type === "light" ? "#fff" : "#1d1c1f")} 22.51%
  );
`;

interface Props {
  onAddFunds: () => void;
  onClose: () => void;
  isAccountSelectionFlow: boolean;
}

export const ActionButtons = ({ onAddFunds, onClose, isAccountSelectionFlow }: Props) => {
  const { t } = useTranslation();

  return (
    <GradientFlex
      paddingTop="32px"
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      paddingLeft="24px"
      paddingRight="24px"
      paddingBottom="40px"
      width="100%"
    >
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
    </GradientFlex>
  );
};
