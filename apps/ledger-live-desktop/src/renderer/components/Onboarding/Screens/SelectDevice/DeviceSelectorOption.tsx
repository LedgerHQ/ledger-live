import React from "react";
import styled, { css, DefaultTheme, ThemeProps } from "styled-components";
import { Flex, Text, Button } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";

const DeviceIllustrationContainer = styled(Flex)`
  transition: transform ease-out 150ms;
  will-change: transform;
`;

type BorderProps = ThemeProps<DefaultTheme> & { isFirst: boolean; isLast: boolean };

const bkgColor = (p: BorderProps) => p.theme.colors.palette.neutral.c00;
const bkgColorHover = (p: BorderProps) => p.theme.colors.palette.neutral.c20;
const borderColorHover = (p: BorderProps) => p.theme.colors.palette.neutral.c40;

const borderCSS = css`
  ${(p: BorderProps) => (p.isFirst ? "" : `border-left: 1px solid ${bkgColor(p)};`)}
  ${(p: BorderProps) => (p.isLast ? "" : `border-right: 1px solid ${bkgColor(p)};`)}
  &:hover {
    ${(p: BorderProps) => (p.isFirst ? "" : `border-left: 1px solid ${borderColorHover(p)};`)}
    ${(p: BorderProps) => (p.isLast ? "" : `border-right: 1px solid ${borderColorHover(p)};`)}
  }
`;

const SelectButton = styled(Button)`
  opacity: 0;
  margin-top: 32px;
`;

const Container = styled(Flex).attrs((p: BorderProps) => ({
  flex: 1,
  height: "100%",
  paddingTop: "38.43px",
  justifyContent: "center",
  backgroundColor: bkgColor(p),
}))`
  transition: background border 200ms;
  &:hover {
    background-color: ${bkgColorHover};
  }
  &:hover ${DeviceIllustrationContainer} {
    transform: translateY(-20px);
  }
  &:hover ${SelectButton} {
    opacity: 1;
  }
  ${borderCSS}
`;

const ContentContainer = styled(Flex).attrs({
  flex: 1,
  flexDirection: "column",
  alignItems: "center",
  alignSelf: "center",
})``;

const DeviceName = styled(Text).attrs({ color: "neutral.c100" })``;

interface DeviceSelectOptionProps {
  label: string;
  Illu: React.ReactNode;
  onClick: () => void;
  id: string;
  isFirst: boolean;
  isLast: boolean;
}

export function DeviceSelectorOption({
  id,
  label,
  Illu,
  onClick,
  isFirst,
  isLast,
}: DeviceSelectOptionProps) {
  const { t } = useTranslation();
  return (
    <Container data-test-id={`v3-container-${id}`} {...{ id, isFirst, isLast }}>
      <ContentContainer>
        <DeviceIllustrationContainer>{Illu}</DeviceIllustrationContainer>
        <DeviceName marginTop="32px" variant="h3">
          {label}
        </DeviceName>
        <SelectButton data-test-id={`v3-${id}`} variant="main" onClick={onClick}>
          {t("onboarding.screens.selectDevice.selectLabel")}
        </SelectButton>
      </ContentContainer>
    </Container>
  );
}
