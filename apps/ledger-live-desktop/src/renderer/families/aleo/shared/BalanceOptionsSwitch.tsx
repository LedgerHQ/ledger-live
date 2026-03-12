import React from "react";
import styled from "styled-components";
import IconTransfer from "~/renderer/icons/Transfer";
import { StyledButton } from "./BalanceOption";
import { useTranslation } from "react-i18next";

const Separator = styled.div`
  display: flex;
  align-items: center;
  & > div {
    flex: 1;
    height: 1px;
    background: ${p => p.theme.colors.neutral.c40};
  }
`;

const StyledSwitchButton = styled(StyledButton)`
  flex: 0;
  transform: rotate(90deg);
  justify-content: center;
  align-items: center;
  padding: 0;
  flex-direction: row;
  min-width: 40px;
  height: 40px;
  border-radius: 100%;
`;

const BalanceOptionsSwitch = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <Separator>
      <div />
      <StyledSwitchButton
        type="button"
        onClick={onClick}
        aria-label={t("aleo.shared.balanceSelector.switchBalance")}
      >
        <IconTransfer size={16} aria-hidden />
      </StyledSwitchButton>
      <div />
    </Separator>
  );
};

export default BalanceOptionsSwitch;
