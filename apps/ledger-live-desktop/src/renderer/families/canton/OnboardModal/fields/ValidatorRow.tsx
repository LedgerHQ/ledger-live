import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { Tabbable } from "~/renderer/components/Box";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import CheckBox from "~/renderer/components/CheckBox";
import LedgerLiveLogo from "~/renderer/components/LedgerLiveLogo";
import Logo from "~/renderer/icons/Logo";

interface ValidatorRowProps {
  isSelected: boolean;
  disabled?: boolean;
}

export const ValidatorRow: React.FC<ValidatorRowProps> = ({ isSelected, disabled = false }) => {
  return (
    <ValidatorRowStyled isSelected={isSelected} disabled={disabled}>
      <ValidatorIcon>
        <LedgerLiveLogo width={32} height={32} icon={<Logo size={18} />} />
      </ValidatorIcon>

      <Box ml={3} flex={1}>
        <Text fontSize={4} fontWeight="600" color="palette.text.shade100">
          <Trans i18nKey="canton.addAccount.authorization.ledgerValidator">Ledger Validator</Trans>
        </Text>
        <Text fontSize={3} color="palette.text.shade60">
          <Trans i18nKey="canton.addAccount.authorization.validatorDescription">
            Automated fund acceptance
          </Trans>
        </Text>
      </Box>

      <CheckBox isChecked={isSelected} disabled={disabled} />
    </ValidatorRowStyled>
  );
};

const ValidatorRowStyled = styled(Tabbable).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  px: 3,
  py: 2,
}))<{ isSelected: boolean; disabled?: boolean }>`
  height: 48px;
  border-radius: 4px;
  background-color: ${p => p.theme.colors.neutral.c30};
  border: 1px solid ${p => (p.isSelected ? p.theme.colors.primary.c60 : p.theme.colors.neutral.c40)};
  cursor: ${p => (p.disabled ? "default" : "pointer")};
  opacity: ${p => (p.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${p =>
      p.disabled ? p.theme.colors.neutral.c30 : p.theme.colors.neutral.c40};
  }
`;

const ValidatorIcon = styled(Box)`
  width: 24px;
  height: 24px;
  background-color: ${p => p.theme.colors.neutral.c80};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
