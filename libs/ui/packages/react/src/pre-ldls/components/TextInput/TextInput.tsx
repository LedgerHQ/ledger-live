import debounce from "lodash/debounce";
import React from "react";
import styled from "styled-components";
import { Icons } from "../../../assets";
import { Flex } from "../../../components";
import { withTokens } from "../../libs";

const DEBOUNCE_MS = 250;

const COLORS_BORDER_STATUS_ERROR_DEFAULT = "colors-border-status-error-default";
const EXTRA_FONT_SIZE = "0.75rem";
const ICON_BUTTONS_SIZE = "32px";
const LABEL_OFFSET_Y = `calc(-0.5 * ${EXTRA_FONT_SIZE})`;
const LABEL_OFFSET_X = "var(--spacing-s, 16px)";
const LABEL_PADDING = "5px";

type NativeInputProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue">;

export type TextInputProps = Readonly<
  NativeInputProps & {
    defaultValue?: string;
    label?: string;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
    error?: boolean;
    helperText?: string;
  }
>;

const ClearButton = styled.button`
  ${withTokens("colors-surface-dark-default")}

  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: ${ICON_BUTTONS_SIZE};
  width: ${ICON_BUTTONS_SIZE};
`;

const Container = styled.div`
  ${withTokens("spacing-xxs")}

  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs, 4px);
  position: relative;
  min-width: 328px;
`;

const Label = styled.label<{ isDisabled: boolean; hasError: boolean; isFocused: boolean }>`
  ${withTokens(
    COLORS_BORDER_STATUS_ERROR_DEFAULT,
    "colors-border-active-default",
    "colors-content-disabled",
    "colors-content-subdued-default-default",
    "spacing-s",
  )}
  color: ${({ hasError, isDisabled, isFocused }) =>
    isDisabled
      ? "var(--colors-content-disabled)"
      : hasError
        ? `var(--${COLORS_BORDER_STATUS_ERROR_DEFAULT});`
        : isFocused
          ? "var(--colors-border-active-default)"
          : "var(--colors-content-subdued-default-default);"};
  font-size: ${EXTRA_FONT_SIZE};
  padding-inline: ${LABEL_PADDING};
  position: absolute;
  top: ${LABEL_OFFSET_Y};
  left: calc(${LABEL_OFFSET_X} - ${LABEL_PADDING});
`;

const Wrapper = styled.div<{
  hasStart: boolean;
  hasEnd: boolean;
}>`
  ${withTokens(
    "colors-content-default-default",
    "colors-surface-transparent-subdued-default",
    "radius-s",
    "spacing-s",
    "spacing-xxs",
  )}

  align-items: center;
  border-radius: var(--radius-s);
  display: flex;
  gap: var(--spacing-xxs, 8px);
  height: 56px;
  padding: ${({ hasEnd, hasStart }) =>
    `0 ${hasEnd ? "var(--spacing-xs, 8px)" : LABEL_OFFSET_X} 0 ${
      hasStart ? "var(--spacing-xs, 8px)" : LABEL_OFFSET_X
    }`};
  position: relative;
  transition: height 0.3s linear;
`;

const StyledInput = styled.input`
  ${withTokens("colors-border-disabled-default")}

  flex: 1;
  background: none;
  border: none;
  cursor: text;
  &[disabled] {
    color: var(--colors-border-disabled-default);
    cursor: not-allowed;
  }
  outline: none;
`;

const Fieldset = styled.fieldset<{
  hasError: boolean;
  hasLabel: boolean;
  isDisabled: boolean;
  isFocused: boolean;
}>`
  ${withTokens(
    COLORS_BORDER_STATUS_ERROR_DEFAULT,
    "colors-border-active-default",
    "colors-content-subdued-default-default",
    "colors-content-disabled",
    "spacing-s",
  )}
  border-radius: var(--radius-s);
  border-color: ${({ isDisabled, hasError, isFocused }) =>
    isDisabled
      ? "var(--colors-content-disabled)"
      : hasError
        ? `var(--${COLORS_BORDER_STATUS_ERROR_DEFAULT})`
        : isFocused
          ? "var(--colors-border-active-default)"
          : "var(--colors-content-subdued-default-default)"};
  border-style: solid;
  border-width: 1px;
  bottom: 0;
  font-size: ${EXTRA_FONT_SIZE};
  left: 0;
  overflow: hidden;
  padding: 0 calc(${LABEL_OFFSET_X} - ${LABEL_PADDING});
  pointer-events: none;
  position: absolute;
  right: 0;
  top: ${({ hasLabel }) => (hasLabel ? LABEL_OFFSET_Y : "0")};
`;

const Legend = styled.legend`
  visibility: hidden;
  padding-inline: ${LABEL_PADDING};
`;

const HelperContainer = styled(Flex)`
  ${withTokens(COLORS_BORDER_STATUS_ERROR_DEFAULT)}
  align-items: center;
`;

// TODO what's the color for disabled helperText?
const HelperText = styled.span<{ hasError: boolean; isDisabled: boolean }>`
  ${withTokens(COLORS_BORDER_STATUS_ERROR_DEFAULT, "colors-border-disabled-default")}
  ${({ isDisabled, hasError }) =>
    isDisabled
      ? "var(--colors-border-disabled-default)"
      : hasError
        ? `color: var(--${COLORS_BORDER_STATUS_ERROR_DEFAULT});`
        : ""}
  font-size: ${EXTRA_FONT_SIZE};
`;

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      name,
      defaultValue = "",
      startAdornment = null,
      endAdornment = null,
      error = false,
      helperText,
      style,
      onFocus,
      onBlur,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = React.useState(false);
    const [value, setValue] = React.useState(defaultValue);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const hideClearDebounced = React.useMemo(
      () => debounce(() => setIsFocused(false), DEBOUNCE_MS),
      [],
    );

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      hideClearDebounced.cancel();
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      hideClearDebounced();
    };

    React.useEffect(() => () => hideClearDebounced.cancel(), [hideClearDebounced]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    const clearInput = () => {
      if (inputRef.current) {
        inputRef.current.value = "";
        setValue("");
        inputRef.current.focus();
      }
    };

    const showClear = value.length > 0 && (isFocused || error);
    const hasEnd = showClear || Boolean(endAdornment);
    const hasError = Boolean(error);
    const hasLabel = Boolean(label);
    const isDisabled = Boolean(rest.disabled);

    return (
      <Container style={style}>
        {label && (
          <Label isDisabled={isDisabled} hasError={hasError} isFocused={isFocused} htmlFor={name}>
            {label}
          </Label>
        )}

        <Wrapper hasStart={Boolean(startAdornment)} hasEnd={hasEnd}>
          {startAdornment}

          <StyledInput
            name={name}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...rest}
            ref={inputRef}
          />

          {showClear ? (
            <ClearButton onClick={clearInput} aria-label="Clear">
              <Icons.DeleteCircleFill size="S" color="var(--colors-surface-dark-default)" />
            </ClearButton>
          ) : (
            endAdornment
          )}

          <Fieldset
            hasError={hasError}
            hasLabel={hasLabel}
            isDisabled={isDisabled}
            isFocused={isFocused}
          >
            {label ? <Legend>{label}</Legend> : null}
          </Fieldset>
        </Wrapper>

        {helperText ? (
          <HelperContainer columnGap={2}>
            {hasError ? (
              <Icons.DeleteCircleFill
                size="S"
                color={`var(--${COLORS_BORDER_STATUS_ERROR_DEFAULT})`}
              />
            ) : null}
            <HelperText isDisabled={isDisabled} hasError={hasError}>
              {helperText}
            </HelperText>
          </HelperContainer>
        ) : null}
      </Container>
    );
  },
);

TextInput.displayName = "TextInput";
