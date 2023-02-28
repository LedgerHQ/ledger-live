import styled, { css } from "styled-components";
import { typography, TypographyProps } from "styled-system";
import React, { InputHTMLAttributes, useState, useMemo, useCallback } from "react";
import CircledCrossSolidMedium from "@ledgerhq/icons-ui/react/CircledCrossSolidMedium";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import { rgba } from "../../../styles/helpers";
import { ButtonUnstyled } from "../../cta/Button";

type ValueType = HTMLInputElement["value"];

export type CommonProps = InputHTMLAttributes<HTMLInputElement> &
  TypographyProps & {
    disabled?: boolean;
    error?: string;
    warning?: string;
    info?: string;
  };

export type InputProps<T = ValueType> = Omit<CommonProps, "value" | "onChange"> & {
  value: T;
  onChange?: (value: T) => void;
  onChangeEvent?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  renderLeft?: ((props: InputProps<T>) => React.ReactNode) | React.ReactNode;
  renderRight?: ((props: InputProps<T>) => React.ReactNode) | React.ReactNode;
  unwrapped?: boolean;
  containerProps?: InputContainerProps;
  clearable?: boolean;
  /**
   * A function can be provided to serialize a value of any type to a string.
   *
   * This can be useful to wrap the `<BaseInput />` component (which expects a string)
   * and create higher-level components that will automatically perform the input/output
   * conversion to other types.
   *
   * *A serializer function should always be used in conjunction with a deserializer function.*
   */
  serialize?: (value: T) => ValueType;
  /**
   * A deserializer can be provided to convert the html input value from a string to any other type.
   *
   * *A deserializer function should always be used in conjunction with a serializer function.*
   */
  deserialize?: (value: ValueType) => T;
};

export type InputContainerProps = React.ComponentProps<typeof InputContainer>;
export const InputContainer = styled.div<Partial<CommonProps> & { focus?: boolean }>`
  display: flex;
  height: 48px;
  border: ${(p) => `1px solid ${p.theme.colors.neutral.c40}`};
  border-radius: 24px;
  transition: all 0.2s ease;
  color: ${(p) => p.theme.colors.neutral.c100};

  ${(p) =>
    p.focus &&
    !p.error &&
    !p.warning &&
    css`
      border: 1px solid ${p.theme.colors.primary.c80};
      box-shadow: 0 0 0 4px ${rgba(p.theme.colors.primary.c60, 0.4)};
    `};

  ${(p) =>
    p.error &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.error.c100};
    `};

  ${(p) =>
    !p.error &&
    p.warning &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.warning.c80};
    `};

  ${(p) =>
    !p.error &&
    !p.warning &&
    !p.disabled &&
    css`
      &:hover {
        border: ${!p.disabled && `1px solid ${p.theme.colors.primary.c80}`};
      }
    `};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.neutral.c60};
      background: ${(p) => p.theme.colors.neutral.c20};
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
  caret-color: ${(p) => (p.error ? p.theme.colors.error.c100 : p.theme.colors.primary.c80)};
  background: none;
  outline: none;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "text")};
  flex-shrink: 1;
  padding-left: 20px;
  padding-right: 20px;
  &::placeholder {
    color: ${(p) => (p.disabled ? p.theme.colors.neutral.c50 : p.theme.colors.neutral.c70)};
  }

  /* stylelint-disable property-no-vendor-prefix */

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
  /* stylelint-enable property-no-vendor-prefix */

  ${typography}
`;

export const InputErrorContainer = styled(Text)`
  color: ${(p) => p.theme.colors.error.c100};
  margin-left: 12px;
`;
export const InputWarningContainer = styled(Text)`
  color: ${(p) => p.theme.colors.warning.c80};
  margin-left: 12px;
`;
export const InputInfoContainer = styled(Text)`
  color: ${(p) => p.theme.colors.neutral.c60};
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

export const ClearableButtonUnstyled = styled(ButtonUnstyled)`
  display: flex;
`;

// Yes, this is dirty. If you can figure out a better way please change the code :).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IDENTITY = (_: any): any => _;

function Input<T = ValueType>(
  props: InputProps<T>,
  ref?: React.ForwardedRef<HTMLInputElement>,
): JSX.Element {
  const {
    value,
    disabled,
    error,
    warning,
    info,
    onChange,
    onChangeEvent,
    renderLeft,
    renderRight,
    unwrapped,
    containerProps,
    serialize = IDENTITY,
    deserialize = IDENTITY,
    clearable,
    ...htmlInputProps
  } = props;
  const [focus, setFocus] = useState(false);
  const inputValue = useMemo(() => serialize(value), [serialize, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange && onChange(deserialize(e.target.value));
      onChangeEvent && onChangeEvent(e);
    },
    [onChange, onChangeEvent, deserialize],
  );

  const handleClear = useCallback(() => {
    onChange && onChange(deserialize(""));
  }, [onChange, deserialize]);

  const inner = (
    <>
      {typeof renderLeft === "function" ? renderLeft(props) : renderLeft}
      <BaseInput
        ref={ref}
        {...htmlInputProps}
        disabled={disabled}
        error={error}
        warning={warning}
        info={info}
        onChange={handleChange}
        value={inputValue}
        onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
          setFocus(true);
          htmlInputProps.onFocus && htmlInputProps.onFocus(event);
        }}
        onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
          setFocus(false);
          htmlInputProps.onBlur && htmlInputProps.onBlur(event);
        }}
      />
      {clearable && inputValue && (
        <FlexBox alignItems={"center"} mr={7}>
          <ClearableButtonUnstyled onClick={handleClear}>
            <CircledCrossSolidMedium size={18} color={"neutral.c50"} />
          </ClearableButtonUnstyled>
        </FlexBox>
      )}
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
      <InputContainer
        disabled={disabled}
        focus={focus}
        error={error}
        warning={warning}
        {...containerProps}
      >
        {inner}
      </InputContainer>
      {(error || warning || info) && !disabled && (
        <FlexBox flexDirection="column" rowGap={2} mt={2}>
          {error ? (
            <InputErrorContainer variant="small">{error}</InputErrorContainer>
          ) : warning ? (
            <InputWarningContainer variant="small">{warning}</InputWarningContainer>
          ) : info ? (
            <InputInfoContainer variant="small">{info}</InputInfoContainer>
          ) : null}
        </FlexBox>
      )}
    </div>
  );
}

export default React.forwardRef(Input) as <T>(
  props: InputProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> },
) => ReturnType<typeof Input>;
