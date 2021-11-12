import styled, { css } from "styled-components";
import { typography, TypographyProps } from "styled-system";
import React, { InputHTMLAttributes, useCallback } from "react";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import { rgba } from "../../../styles/helpers";

export type CommonProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> &
  TypographyProps & {
    disabled?: boolean;
    error?: string;
    warning?: string;
  };

export type InputProps = CommonProps & {
  onChange: (e: string) => void;
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
    !p.warning &&
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
    p.warning &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.palette.warning.c80};
    `};

  ${(p) =>
    !p.error &&
    !p.warning &&
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

export const BaseInput = styled.input.attrs<
  Partial<CommonProps> & { focus?: boolean } & TypographyProps
>({
  fontSize: "paragraph",
  fontWeight: "medium",
})<Partial<CommonProps> & { focus?: boolean } & TypographyProps>`
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
export const InputWarningContainer = styled(Text)`
  color: ${(p) => p.theme.colors.palette.warning.c80};
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

function Input(props: InputProps, ref: React.ForwardedRef<HTMLInputElement>): JSX.Element {
  const {
    value,
    disabled,
    error,
    warning,
    onChange,
    renderLeft,
    renderRight,
    unwrapped,
    ...htmlInputProps
  } = props;
  const [focus, setFocus] = React.useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
  );

  const inner = (
    <>
      {typeof renderLeft === "function" ? renderLeft(props) : renderLeft}
      <BaseInput
        ref={ref}
        {...htmlInputProps}
        disabled={disabled}
        error={error}
        warning={warning}
        onChange={handleChange}
        value={value}
        onFocus={(event) => {
          setFocus(true);
          htmlInputProps.onFocus && htmlInputProps.onFocus(event);
        }}
        onBlur={(event) => {
          setFocus(false);
          htmlInputProps.onBlur && htmlInputProps.onBlur(event);
        }}
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
      <InputContainer disabled={disabled} focus={focus} error={error} warning={warning}>
        {inner}
      </InputContainer>
      {(error || warning) && !disabled && (
        <FlexBox flexDirection="column" rowGap={2} mt={2}>
          {error && <InputErrorContainer variant="small">{error}</InputErrorContainer>}
          {warning && <InputWarningContainer variant="small">{warning}</InputWarningContainer>}
        </FlexBox>
      )}
    </div>
  );
}

export default React.forwardRef(Input);
