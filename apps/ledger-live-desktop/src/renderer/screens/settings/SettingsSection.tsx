import React from "react";
import styled from "styled-components";
import { rgba } from "~/renderer/styles/helpers";
import Box, { Card } from "~/renderer/components/Box";
import { Flex, Link } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";

export const SettingsSection = styled(Card).attrs(() => ({
  p: 0,
}))``;
export const SettingsSectionHeaderContainer = styled(Box).attrs(() => ({
  p: 4,
  horizontal: true,
  alignItems: "center",
}))`
  line-height: normal;
`;
const RoundIconContainer = styled(Box).attrs(p => ({
  alignItems: "center",
  justifyContent: "center",
  bg: rgba(p.theme.colors.wallet, 0.2),
  color: "wallet",
}))`
  height: 34px;
  width: 34px;
  border-radius: 50%;
`;
export const SettingsSectionBody = styled(Box)`
  > * + * {
    position: relative;
    &:after {
      background: ${p => p.theme.colors.palette.divider};
      content: "";
      display: block;
      height: 1px;
      left: 0;
      position: absolute;
      right: 0;
      top: 0;
    }
  }
`;
type SettingsSectionHeaderProps = {
  title: string;
  desc: string;
  icon: JSX.Element;
  renderRight?: JSX.Element;
  onClick?: () => void;
  style?: React.CSSProperties;
};
export const SettingsSectionHeader = ({
  title,
  desc,
  icon,
  renderRight = undefined,
  onClick,
  style,
}: SettingsSectionHeaderProps) => (
  <SettingsSectionHeaderContainer tabIndex={-1} onClick={onClick} style={style}>
    <RoundIconContainer mr={3}>{icon}</RoundIconContainer>
    <Box grow flex={1} mr={3}>
      <Box ff="Inter|Medium" color="palette.text.shade100">
        {title}
      </Box>
      <Box ff="Inter" fontSize={3} mt={1}>
        {desc}
      </Box>
    </Box>
    {renderRight && (
      <Box alignItems="center" justifyContent="flex-end">
        {renderRight}
      </Box>
    )}
  </SettingsSectionHeaderContainer>
);
export const SettingsSectionRowContainer = styled(Box).attrs<{
  inset?: boolean;
}>(p => ({
  p: p.inset ? 3 : 4,
  m: p.inset ? 4 : 0,
  horizontal: true,
  alignItems: "center",
  relative: true,
  justifyContent: "space-between",
  backgroundColor: p.inset ? p.theme.colors.palette.text.shade5 : "transparent",
  borderRadius: p.inset ? 4 : 0,
}))<{ inset?: boolean }>``;

type SettingsSectionRowProps = {
  title?: string | React.ReactNode;
  desc: string | React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  inset?: boolean;
  contentContainerStyle?: React.CSSProperties;
  descContainerStyle?: React.CSSProperties;
  childrenContainerStyle?: React.CSSProperties;
  dataTestId?: string;
  id?: string;
  externalUrl?: string;
  linkText?: string;
};
export const SettingsSectionRow = ({
  title,
  desc,
  children = null,
  onClick = () => null,
  inset = false,
  contentContainerStyle,
  descContainerStyle,
  childrenContainerStyle,
  dataTestId,
  id,
  externalUrl,
  linkText,
}: SettingsSectionRowProps) => (
  <SettingsSectionRowContainer
    onClick={onClick}
    tabIndex={-1}
    inset={inset}
    data-testid={dataTestId}
    id={id}
  >
    <Box
      grow
      shrink
      style={{
        marginRight: "10%",
        ...(contentContainerStyle || {}),
      }}
    >
      {title && (
        <Box ff="Inter|SemiBold" color="palette.text.shade100" fontSize={14}>
          {title}
        </Box>
      )}
      <Box
        ff="Inter"
        fontSize={3}
        color="palette.text.shade60"
        mt={1}
        mr={1}
        style={{
          maxWidth: 520,
          ...(descContainerStyle || {}),
        }}
      >
        {desc}
      </Box>
      {externalUrl && (
        <Flex
          color="palette.text.shade60"
          mr={1}
          style={{
            ...(descContainerStyle || {}),
          }}
        >
          <Link
            alwaysUnderline
            color="palette.text.shade60"
            textProps={{
              fontFamily: "Inter",
              fontSize: 3,
              fontWeight: "500",
            }}
            onClick={() => openURL(externalUrl)}
          >
            {linkText}
          </Link>
        </Flex>
      )}
    </Box>
    <Box style={childrenContainerStyle}>{children}</Box>
  </SettingsSectionRowContainer>
);
