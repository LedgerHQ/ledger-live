import React from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui";
import { fontSize, textAlign, fontWeight, color } from "styled-system";
import Box from "~/renderer/components/Box";

const DateInputContainer = styled(Box).attrs(() => ({
  horizontal: true,
}))<{
  disabled?: boolean;
  small?: boolean;
  error?: boolean;
  isFocus?: boolean;
}>`
  background: ${p =>
    p.disabled ? p.theme.colors.background.default : p.theme.colors.background.card};
  border-radius: ${p => p.theme.radii[1]}px;
  border-width: 1px;
  border-style: solid;
  border-color: ${p =>
    p.error
      ? p.theme.colors.pearl
      : p.isFocus
        ? p.theme.colors.primary.c80
        : p.theme.colors.neutral.c40};
  box-shadow: ${p => (p.isFocus ? `rgba(0, 0, 0, 0.05) 0 2px 2px` : "none")};
  height: ${p => (p.small ? "34" : "48")}px;
  position: relative;
`;

const DateInputBase = styled.input.attrs(() => ({
  fontSize: 4,
  type: "date",
}))`
  font-family: "Inter";
  font-weight: 600;
  color: ${p => p.theme.colors.neutral.c100};
  border: 0;
  ${fontSize};
  ${textAlign};
  ${fontWeight};
  ${color};
  height: 100%;
  outline: none;
  padding: 0 15px;
  width: 100%;
  background: none;
  cursor: ${p => (p.disabled ? "not-allowed" : "text")};

  &::placeholder {
    color: ${p => p.theme.colors.neutral.c60};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-calendar-picker-indicator {
    display: none;
    -webkit-appearance: none;
  }

  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0;
    position: absolute;
    right: 0;
    width: 100%;
    height: 100%;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorLabel = styled(Text).attrs(() => ({
  style: { fontSize: 12 },
}))`
  color: ${p => p.theme.colors.pearl};
`;

export type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  small?: boolean;
  error?: boolean;
  errorMessage?: string;
  placeholder?: string;
  id?: string;
  "data-testid"?: string;
} & Omit<React.ComponentProps<typeof DateInputBase>, "type" | "onChange" | "onBlur" | "onFocus">;

export function DatePicker({
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  small = false,
  error = false,
  errorMessage,
  placeholder,
  id,
  "data-testid": dataTestId,
  ...props
}: Readonly<DatePickerProps>) {
  const [isFocus, setIsFocus] = React.useState(false);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    },
    [onChange],
  );

  const handleFocus = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocus(true);
      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus],
  );

  const handleBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocus(false);
      if (onBlur) {
        onBlur(e);
      }
    },
    [onBlur],
  );

  return (
    <>
      <DateInputContainer disabled={disabled} small={small} error={error} isFocus={isFocus}>
        <DateInputBase
          {...props}
          id={id}
          data-testid={dataTestId}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
        />
      </DateInputContainer>
      {error && <ErrorLabel>{errorMessage}</ErrorLabel>}
    </>
  );
}
