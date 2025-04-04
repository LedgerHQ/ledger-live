import React from "react";
import styled from "styled-components";
import externalLink from "~/renderer/images/external-link.svg";
import Label from "./Label";
const Wrapper = styled(Label).attrs<{
  fontSize: number;
}>(props => ({
  ff: "Inter|SemiBold",
  color: props.color,
  fontSize: props.fontSize,
  alignItems: "center",
}))`
  cursor: pointer;
  display: inline-flex;
  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.6;
  }

  &:after {
    // prettier-ignore
    -webkit-mask: url('${externalLink}');
    -webkit-mask-size: cover;
    width: 12px;
    height: 12px;
    vertical-align: baseline;
    margin-left: 6px;
    content: "";
    display: inline-block;
    background: currentColor;
  }
`;
type Props = {
  onClick?: React.MouseEventHandler<HTMLLabelElement>;
  label?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  fontSize?: number;
  color?: string;
  id?: string;
}; // can add more dynamic options if needed
export function LinkWithExternalIcon({
  onClick,
  label,
  children,
  style,
  fontSize,
  color = "wallet",
  id,
}: Props) {
  return (
    <Wrapper
      onClick={onClick}
      style={style}
      fontSize={fontSize || 4}
      color={color}
      data-testid={id}
    >
      {label || children}
    </Wrapper>
  );
}
export default LinkWithExternalIcon;
