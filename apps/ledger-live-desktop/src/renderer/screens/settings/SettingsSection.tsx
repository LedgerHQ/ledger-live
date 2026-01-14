import React from "react";
import styled from "styled-components";
import Box, { Card } from "~/renderer/components/Box";
import { Flex, Link } from "@ledgerhq/react-ui";
import { openURL } from "~/renderer/linking";

export const SettingsSection = styled(Card).attrs(() => ({
  p: 0,
}))``;

export const SettingsSectionBody = styled(Box)`
  > * + * {
    position: relative;
    &:after {
      background: ${p => p.theme.colors.neutral.c40};
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
  backgroundColor: p.inset ? p.theme.colors.neutral.c40 : "transparent",
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
        <Box ff="Inter|SemiBold" color="neutral.c100" fontSize={14}>
          {title}
        </Box>
      )}
      <Box
        ff="Inter"
        fontSize={3}
        color="neutral.c70"
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
          color="neutral.c70"
          mr={1}
          style={{
            ...(descContainerStyle || {}),
          }}
        >
          <Link
            alwaysUnderline
            color="neutral.c70"
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
