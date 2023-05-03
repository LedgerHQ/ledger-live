import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { fontSize, textAlign, fontWeight, color } from "styled-system";
import noop from "lodash/noop";
import fontFamily from "~/renderer/styles/styled/fontFamily";
import Box from "~/renderer/components/Box";
import TranslatedError from "~/renderer/components/TranslatedError";
import BigSpinner from "~/renderer/components/BigSpinner";
import { BoxProps } from "./Box/Box";

export type InputError = Error | boolean | null | undefined;

const RenderLeftWrapper = styled(Box)`
  align-items: center;
  justify-content: center;
`;
const RenderRightWrapper = styled(Box)`
  margin-left: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  & > * {
    flex: 1;
  }
`;

type InnerProps = {
  noBorder?: boolean;
  noBorderLeftRadius?: boolean;
  noBoxShadow?: boolean;
  isFocus?: boolean;
  disabled?: boolean;
  small?: boolean;
  error?: InputError;
  warning?: InputError;
  editInPlace?: boolean;
};

export const Container = styled(Box).attrs(() => ({
  horizontal: true,
}))<InnerProps>`
  background: ${p =>
    p.disabled
      ? p.theme.colors.palette.background.default
      : p.theme.colors.palette.background.paper};

  ${p =>
    p.noBorderLeftRadius
      ? `
      border-top-right-radius: ${p.theme.radii[1]}px;
      border-bottom-right-radius: ${p.theme.radii[1]}px;`
      : `
    border-radius: ${p.theme.radii[1]}px;
  `}
  border-width: ${p => (p.noBorder ? 0 : 1)}px;
  border-style: solid;
  border-color: ${p =>
    p.error
      ? p.theme.colors.pearl
      : p.warning
      ? p.theme.colors.warning
      : p.isFocus
      ? p.theme.colors.palette.primary.main
      : p.theme.colors.palette.divider};
  box-shadow: ${p => (p.isFocus && !p.noBoxShadow ? `rgba(0, 0, 0, 0.05) 0 2px 2px` : "none")};
  height: ${p => (p.small ? "34" : "48")}px;
  position: relative;

  &:not(:hover) {
    background: ${p => (!p.isFocus && p.editInPlace ? "transparent" : undefined)};
    border-color: ${p => (!p.isFocus && p.editInPlace ? "transparent" : undefined)};
  }

  ${p =>
    p.error
      ? `--status-color: ${p.theme.colors.pearl};`
      : p.warning
      ? `--status-color: ${p.theme.colors.warning};`
      : p.isFocus
      ? `--status-color: ${p.theme.colors.palette.primary.main};`
      : ""}

  ${p =>
    (p.error || p.warning || p.isFocus) &&
    `> ${RenderRightWrapper} *,
    > ${RenderLeftWrapper} *{
      color: var(--status-color);
      border-color: var(--status-color);
    }`}
`;

type ErrorContainerInnerProps = {
  hasError?: Error | boolean | null | undefined;
};

export const ErrorContainer = styled(Box)<ErrorContainerInnerProps & BoxProps>`
  margin-top: 0px;
  font-size: 12px;
  width: 100%;
  transition: all 0.4s ease-in-out;
  will-change: max-height;
  max-height: ${(p: ErrorContainerInnerProps) => (p.hasError ? 60 : 0)}px;
  min-height: ${(p: ErrorContainerInnerProps) => (p.hasError ? 20 : 0)}px;
  overflow: hidden;
`;

const ErrorDisplay = styled(Box)`
  color: ${p => p.theme.colors.pearl};
`;
const WarningDisplay = styled(Box)`
  color: ${p => p.theme.colors.warning};
`;
const LoadingDisplay = styled(Box)`
  position: absolute;
  right: 0px;
  top: 0px;
  bottom: 0px;
  width: 100%;
  pointer-events: none;
  flex-direction: row;
  align-items: center;
  display: flex;
  justify-content: flex-end;
  border-radius: 4px;
  padding-right: 10px;
`;
export const BaseContainer = styled(Box)``;
const Base = styled.input.attrs(() => ({
  fontSize: 4,
}))`
  font-family: "Inter";
  font-weight: 600;
  color: ${p => p.theme.colors.palette.text.shade100};
  border: 0;
  ${fontFamily};
  ${fontSize};
  ${textAlign};
  ${fontWeight};
  ${color};
  height: 100%;
  outline: none;
  padding: 0;
  width: 100%;
  background: none;
  cursor: ${p => (p.disabled ? "not-allowed" : "text")};

  &::placeholder {
    color: ${p => p.theme.colors.palette.text.shade40};
  }

  &[type="date"] {
    ::-webkit-inner-spin-button,
    ::-webkit-calendar-picker-indicator {
      display: none;
      -webkit-appearance: none;
    }
  }
`;

export type Props = {
  onChange?: (a: string) => void;
  onBlur?: (a: React.FocusEvent<HTMLInputElement>) => void;
  onEnter?: (a: React.KeyboardEvent<HTMLInputElement>) => void;
  onEsc?: (a: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (a: React.FocusEvent<HTMLInputElement>) => void;
  renderLeft?: React.ReactNode;
  renderRight?: React.ReactNode;
  containerProps?: object;
  loading?: boolean;
  error?: InputError;
  warning?: InputError;
  small?: boolean;
  editInPlace?: boolean;
  disabled?: boolean;
  hideErrorMessage?: boolean;
  value?: string;
  placeholder?: string;
  ff?: string;
} & React.ComponentProps<typeof Base>;

const Input = function Input(
  {
    renderLeft = null,
    renderRight = null,
    containerProps,
    editInPlace,
    small = false,
    error,
    loading,
    warning,
    disabled,
    onChange,
    onEnter,
    onEsc,
    onFocus = noop,
    onBlur = noop,
    hideErrorMessage,
    value,
    ...props
  }: Props,
  inputRef: React.ForwardedRef<HTMLInputElement> | null,
) {
  const [isFocus, setFocus] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // handle enter key
      if (e.which === 13 && onEnter) {
        onEnter(e);
      } else if (e.which === 27 && onEsc) {
        onEsc(e);
      }
    },
    [onEnter, onEsc],
  );

  const handleClick = useCallback(() => {
    inputRef && "current" in inputRef && inputRef.current?.focus();
  }, [inputRef]);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(true);
      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus],
  );
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocus(false);
      if (onBlur) {
        onBlur(e);
      }
    },
    [onBlur],
  );
  return (
    <Container
      onClick={handleClick}
      isFocus={isFocus}
      shrink
      {...containerProps}
      disabled={disabled}
      small={small}
      error={error}
      warning={warning}
      editInPlace={editInPlace}
    >
      {!loading || isFocus ? <RenderLeftWrapper>{renderLeft}</RenderLeftWrapper> : null}
      <BaseContainer px={3} grow shrink>
        <Base
          {...props}
          placeholder={loading ? "" : props.placeholder}
          value={loading ? "" : value}
          // small={small}
          disabled={disabled}
          ref={inputRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />

        <ErrorContainer hasError={!hideErrorMessage && (error || warning)}>
          {!hideErrorMessage ? (
            error ? (
              typeof error === "boolean" ? null : (
                <ErrorDisplay id="input-error" data-testid="input-error">
                  <TranslatedError error={error} />
                </ErrorDisplay>
              )
            ) : warning ? (
              typeof warning === "boolean" ? null : (
                <WarningDisplay id="input-warning">
                  <TranslatedError error={warning} />
                </WarningDisplay>
              )
            ) : null
          ) : null}
        </ErrorContainer>
        {loading && !isFocus ? (
          <LoadingDisplay>
            <BigSpinner size={16} />
          </LoadingDisplay>
        ) : null}
      </BaseContainer>
      {renderRight ? <RenderRightWrapper>{renderRight}</RenderRightWrapper> : null}
    </Container>
  );
};
export default React.forwardRef(Input) as typeof Input;
