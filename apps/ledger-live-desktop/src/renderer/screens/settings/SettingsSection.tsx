import React from "react";
import styled from "styled-components";
import Box, { Card } from "~/renderer/components/Box";
export const SettingsSection = styled(Card).attrs(() => ({
  p: 0,
}))``;

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
    </Box>
    <Box style={childrenContainerStyle}>{children}</Box>
  </SettingsSectionRowContainer>
);
