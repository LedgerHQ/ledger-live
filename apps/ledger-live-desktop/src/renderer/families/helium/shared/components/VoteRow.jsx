// @flow
import React, { useRef, useCallback, memo } from "react";
import styled, { css } from "styled-components";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";

const InfoContainer = styled(Box).attrs(() => ({
  vertical: true,
  ml: 2,
  flex: 1,
}))``;

const Title = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
}))`
  width: min-content;
  max-width: 100%;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: ${p => p.theme.colors.palette.text.shade100};

  &:hover {
    color: ${p => p.theme.colors.palette.primary.main};
  }

  ${Text} {
    flex: 0 1 auto;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const SubTitle = styled(Box).attrs(() => ({
  horizontal: true,
}))`
  font-size: 11px;
  font-weight: 500;
  color: ${p => p.theme.colors.palette.text.shade60};
`;

const SideInfo = styled(Box)``;

const InputRight = styled(Box).attrs(() => ({
  ff: "Inter|Medium",
  color: "palette.text.shade60",
  fontSize: 4,
  justifyContent: "center",
  horizontal: true,
}))`
  opacity: 0;
  pointer-events: none;
  padding: 5px ${p => p.theme.space[2]}px;
  > * {
    color: white !important;
  }
`;

const InputBox = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
}))`
  position: relative;
  flex-basis: 160px;
  height: 32px;
  &:focus ${InputRight}, &:focus-within ${InputRight} {
    opacity: 1;
    pointer-events: auto;
  }
  #input-error {
    font-size: 10px;
    padding-bottom: 4px;
  }
`;

const Row: ThemedComponent<{ active: boolean, disabled: boolean }> = styled(Box).attrs(() => ({
  horizontal: true,
  flex: "0 0 56px",
  mb: 2,
  alignItems: "center",
  justifyContent: "flex-start",
  p: 2,
}))`
  border-radius: 4px;
  border: 1px solid transparent;
  position: relative;
  overflow: visible;
  border-color: ${p =>
    p.active ? p.theme.colors.palette.primary.main : p.theme.colors.palette.divider};
  ${p =>
    p.active
      ? `&:before {
        content: "";
        width: 4px;
        height: 100%;
        top: 0;
        left: 0;
        position: absolute;
        background-color: ${p.theme.colors.palette.primary.main};
      }`
      : ""}
  ${p =>
    p.disabled
      ? css`
          ${InputBox} {
            pointer-events: none;
          }
        `
      : ""}
  ${p =>
    p.onClick
      ? css`
          &:hover {
            border-color: ${p.theme.colors.palette.primary.main};
          }
        `
      : ""}
`;

export type HIPRowProps = {
  vote: any,
  title: React$Node,
  subtitle: React$Node,
  sideInfo?: React$Node,
  value?: number,
  disabled?: boolean,
  onClick?: (*) => void,
  style?: *,
  className?: string,
};

const VoteRow = ({
  vote,
  title,
  subtitle,
  sideInfo,
  value,
  disabled,
  onClick = () => {},
  style,
  className,
}: HIPRowProps) => {
  const inputRef = useRef();

  /** focus input on row click */
  const onRowClick = useCallback(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
    onClick(vote);
  }, [inputRef, onClick, vote]);

  return (
    <Row
      className={className}
      style={style}
      disabled={!value && disabled}
      active={!!value}
      onClick={onRowClick}
    >
      <InfoContainer>
        <Title>
          <Text>{title}</Text>
        </Title>
        <SubTitle>{subtitle}</SubTitle>
      </InfoContainer>
      <SideInfo>{sideInfo}</SideInfo>
    </Row>
  );
};

export default memo(VoteRow);
