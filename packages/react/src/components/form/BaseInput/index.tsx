import styled, { css } from "styled-components";
import { typography, TypographyProps } from "styled-system";
import React, { InputHTMLAttributes } from "react";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import { rgba } from "../../../styles/helpers";

export type CommonProps = InputHTMLAttributes<HTMLInputElement> &
  TypographyProps & {
    disabled?: boolean;
    error?: string;
  };

export type InputProps = CommonProps & {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  renderLeft?: ((props: CommonProps) => React.ReactNode) | React.ReactNode;
  renderRight?: ((props: CommonProps) => React.ReactNode) | React.ReactNode;
  unwrapped?: boolean;
};

export const InputContainer = styled.div<Partial<CommonProps> & { focus?: boolean }>`
  display: flex;
  height: 48px;
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 24px;
  transition: all 0.2s ease;
  color: ${(p) => p.theme.colors.palette.neutral.c100};

  ${(p) =>
    p.focus &&
    !p.error &&
    css`
      border: 1px solid ${p.theme.colors.palette.primary.c80};
      box-shadow: 0 0 0 4px ${rgba(p.theme.colors.palette.primary.c60, 0.48)};
    `};

  ${(p) =>
    p.error &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.palette.error.c100};
    `};

  ${(p) =>
    !p.error &&
    !p.disabled &&
    css`
      &:hover {
        border: ${!p.disabled && `1px solid ${p.theme.colors.palette.primary.c80}`};
      }
    `};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.palette.neutral.c60};
      background: ${(p) => p.theme.colors.palette.neutral.c20};
    `};
`;

export const BaseInput = styled.input<Partial<CommonProps> & { focus?: boolean } & TypographyProps>`
  height: 100%;
  width: 100%;
  border: 0;
  caret-color: ${(p) =>
    p.error ? p.theme.colors.palette.error.c100 : p.theme.colors.palette.primary.c80};
  background: none;
  outline: none;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "text")};
  flex-shrink: 1;
  padding-top: 14px;
  padding-bottom: 14px;
  padding-left: 20px;
  padding-right: 20px;
  &::placeholder {
    color: ${(p) =>
      p.disabled ? p.theme.colors.palette.neutral.c50 : p.theme.colors.palette.neutral.c70};
  }

  /* Hide type=number arrow for Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Hide type=number arrow for Firefox */
  &[type="number"] {
    -moz-appearance: textfield;
  }

  ${typography}
`;

export const InputErrorContainer = styled(Text)`
  color: ${(p) => p.theme.colors.palette.error.c100};
  margin-left: 12px;
`;

export const InputRenderLeftContainer = styled(FlexBox).attrs(() => ({
  alignItems: "center",
  pl: "16px",
}))``;

export const InputRenderRightContainer = styled(FlexBox).attrs(() => ({
  alignItems: "center",
  pr: "16px",
}))``;

export default function Input(props: InputProps): JSX.Element {
  const {
    value,
    disabled,
    error,
    onChange,
    renderLeft,
    renderRight,
    unwrapped,
    ...htmlInputProps
  } = props;
  const [focus, setFocus] = React.useState(false);

  const inner = (
    <>
      {typeof renderLeft === "function" ? renderLeft(props) : renderLeft}
      <BaseInput
        {...htmlInputProps}
        disabled={disabled}
        error={error}
        onChange={onChange}
        value={value}
        onFocus={(event) => {
          setFocus(true);
          htmlInputProps.onFocus && htmlInputProps.onFocus(event);
        }}
        onBlur={(event) => {
          setFocus(false);
          htmlInputProps.onBlur && htmlInputProps.onBlur(event);
        }}
        className={"ll-text_body"}
      />
      {typeof renderRight === "function" ? renderRight(props) : renderRight}
    </>
  );

  if (unwrapped) {
    return (
      <FlexBox alignItems="stretch" style={{ height: "100%" }}>
        {inner}
      </FlexBox>
    );
  }

  return (
    <div>
      <InputContainer disabled={disabled} focus={focus} error={error}>
        {inner}
      </InputContainer>
      {error && !disabled && <InputErrorContainer type="navigation">{error}</InputErrorContainer>}
    </div>
  );
}
