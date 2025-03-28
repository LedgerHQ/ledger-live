import React, { useRef, useCallback, memo } from "react";
import { Trans } from "react-i18next";
import styled, { css } from "styled-components";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ExternalLink from "~/renderer/icons/ExternalLink";
import InputCurrency from "~/renderer/components/InputCurrency";
import { colors } from "~/renderer/styles/theme";

export const IconContainer = styled.div<{
  isSR?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${p =>
    p.isSR ? p.theme.colors.palette.action.hover : p.theme.colors.palette.divider};
  color: ${p =>
    p.isSR ? p.theme.colors.palette.primary.main : p.theme.colors.palette.text.shade60};
`;

const InfoContainer = styled(Box).attrs(() => ({
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
  ${IconContainer} {
    background-color: rgba(0, 0, 0, 0);
    color: ${p => p.theme.colors.palette.primary.main};
    opacity: 0;
  }
  &:hover {
    color: ${p => p.theme.colors.palette.primary.main};
  }
  &:hover > ${IconContainer} {
    opacity: 1;
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
}))<{
  active?: boolean;
}>`
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
const MaxButton = styled.button`
  background-color: ${p => p.theme.colors.palette.primary.main};
  color: ${p => p.theme.colors.palette.primary.contrastText}!important;
  border: none;
  border-radius: 4px;
  padding: 0px ${p => p.theme.space[2]}px;
  margin: 0 2.5px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms ease-out;
  &:hover {
    filter: contrast(2);
  }
`;

const Row = styled(Box).attrs(() => ({
  horizontal: true,
  flex: "0 0 56px",
  mb: 2,
  alignItems: "center",
  justifyContent: "flex-start",
  p: 2,
}))<{
  active: boolean;
  disabled?: boolean;
}>`
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
          ${IconContainer} {
            opacity: 1;
            color: inherit;
          }
        `
      : ""}
`;

export type ValidatorRowProps = {
  validator: {
    address: string;
  };
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  sideInfo?: React.ReactNode;
  value?: number;
  disabled?: boolean;
  maxAvailable?: number;
  notEnoughVotes?: boolean;
  onClick?: (a: ValidatorRowProps["validator"]) => void;
  onUpdateVote?: (b: string, a: string) => void;
  onExternalLink: (address: string) => void;
  style?: React.CSSProperties;
  unit: Unit;
  onMax?: () => void;
  shouldRenderMax?: boolean;
  className?: string;
};
const ValidatorRow = ({
  validator,
  icon,
  title,
  subtitle,
  sideInfo,
  value,
  disabled,
  onUpdateVote,
  onExternalLink,
  maxAvailable = 0,
  notEnoughVotes,
  onClick = () => null,
  style,
  unit,
  onMax,
  shouldRenderMax,
  className,
}: ValidatorRowProps) => {
  const inputRef = useRef<HTMLInputElement>();
  const onTitleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      e.stopPropagation();
      onExternalLink(validator.address);
    },
    [validator, onExternalLink],
  );
  const onChange = useCallback(
    // onChange: (b: BigNumber, a: Unit) => void;
    (e: BigNumber) => {
      onUpdateVote && onUpdateVote(validator.address, e.toString());
    },
    [validator, onUpdateVote],
  );
  const onMaxHandler = useCallback(() => {
    onUpdateVote &&
      onUpdateVote(
        validator.address,
        BigNumber(value || 0)
          .plus(maxAvailable)
          .toString(),
      );
  }, [validator, onUpdateVote, maxAvailable, value]);

  /** focus input on row click */
  const onRowClick = useCallback(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
    onClick(validator);
  }, [inputRef, onClick, validator]);
  const itemExists = typeof value === "number";
  const input = onUpdateVote && (
    <InputBox active={!!value}>
      <InputCurrency
        containerProps={{
          grow: true,
          style: {
            height: 32,
            zIndex: 10,
            borderColor: colors.lightFog,
          },
        }}
        unit={unit}
        error={itemExists && notEnoughVotes}
        disabled={disabled}
        value={BigNumber(value ?? 0)}
        onChange={onChange}
        renderRight={
          <InputRight>
            {shouldRenderMax && (
              <MaxButton onClick={onMax || onMaxHandler}>
                <Trans i18nKey="vote.steps.castVotes.max" />
              </MaxButton>
            )}
          </InputRight>
        }
      />
    </InputBox>
  );
  return (
    <Row
      className={className}
      style={style}
      disabled={!value && disabled}
      active={!!value}
      onClick={onRowClick}
      data-testid="modal-provider-row"
    >
      {icon}
      <InfoContainer>
        <Title onClick={onTitleClick}>
          <Text data-testid="modal-provider-title">{title}</Text>
          <IconContainer>
            <ExternalLink size={16} />
          </IconContainer>
        </Title>
        <SubTitle>{subtitle}</SubTitle>
      </InfoContainer>
      <SideInfo>{sideInfo}</SideInfo>
      {input}
    </Row>
  );
};
export default memo<ValidatorRowProps>(ValidatorRow);
