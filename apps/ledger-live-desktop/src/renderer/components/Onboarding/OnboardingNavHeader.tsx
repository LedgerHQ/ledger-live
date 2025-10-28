import React from "react";
import styled, { useTheme } from "styled-components";
import { Button, Header, IconsLegacy, Logos } from "@ledgerhq/react-ui";
import LangSwitcher from "./LangSwitcher";
import { useTranslation } from "react-i18next";

const OnboardingContainer = styled(Header)`
  position: absolute;
  top: 40px;
  left: 16px;
  right: 30px;
  z-index: 1;
  align-items: center;
`;

interface Props {
  onClickPrevious: (event?: React.SyntheticEvent<HTMLButtonElement, Event>) => void;
}

export default function OnboardingNavHeader({ onClickPrevious }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const left = (
    <Button iconPosition="left" Icon={IconsLegacy.ArrowLeftMedium} onClick={onClickPrevious}>
      {t("common.previous")}
    </Button>
  );
  const right = <LangSwitcher />;
  return (
    <OnboardingContainer {...{ left, right }}>
      <Logos.LedgerLiveRegular color={colors.neutral.c100} height={24} />
    </OnboardingContainer>
  );
}
