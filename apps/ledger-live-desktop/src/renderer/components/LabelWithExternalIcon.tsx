import React from "react";
import styled, { DefaultTheme } from "styled-components";
import Label from "~/renderer/components/Label";
import Box from "~/renderer/components/Box";
import IconExternalLink from "~/renderer/icons/ExternalLink";

const LabelWrapper = styled(Label).attrs<{
  ff?: string;
  hoverColor: string;
}>(p => ({
  ff: p.ff ? p.ff : "Inter|Medium",
}))<{
  ff?: string;
  hoverColor: string;
  color?: keyof DefaultTheme["colors"];
}>`
  display: inline-flex;
  color: ${p => (p.color && p.theme.colors[p.color]) || p.theme.colors.palette.text.shade60};
  &:hover {
    color: ${p => p.theme.colors[p.hoverColor]};
    cursor: pointer;
  }
`;
type Props = {
  onClick: (e?: React.MouseEvent) => void | undefined | null;
  label: string | React.ReactNode;
  color?: string;
  hoverColor?: string;
  ff?: string;
  iconFirst?: boolean;
}; // can add more dynamic options if needed
export function LabelWithExternalIcon({
  onClick,
  label,
  color,
  hoverColor = "wallet",
  ff,
  iconFirst = false,
}: Props) {
  return (
    <LabelWrapper onClick={onClick} color={color} hoverColor={hoverColor} ff={ff}>
      {iconFirst ? (
        <>
          <Box mr={1}>
            <IconExternalLink size={12} />
          </Box>
          <span>{label}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <Box ml={1}>
            <IconExternalLink size={12} />
          </Box>
        </>
      )}
    </LabelWrapper>
  );
}
export default LabelWithExternalIcon;
