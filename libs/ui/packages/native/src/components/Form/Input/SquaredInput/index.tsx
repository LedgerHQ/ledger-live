import React, { useMemo, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { TextInput, TextInputProps, ColorValue, StyleProp, ViewStyle } from "react-native";
import styled, { css } from "styled-components/native";
import Text from "../../../Text";
import FlexBox from "../../../Layout/Flex";

export type CommonProps = TextInputProps & {
  disabled?: boolean;
  error?: string;
};

export type InputProps<T = string> = Omit<CommonProps, "value" | "onChange"> & {
  /**
   * The value of the input.
   */
  value: T;
  /**
   * A function that will render some content on the left side of the input.
   */
  renderLeft?: ((props: InputProps<T>) => React.ReactNode) | React.ReactNode;
  /**
   * A function that will render some content on the right side of the input.
   */
  renderRight?: ((props: InputProps<T>) => React.ReactNode) | React.ReactNode;
  /**
   * Triggered when the input value is updated.
   */
  onChange?: (value: T) => void;
  /**
   * Same as onChange but preserves the native event passed as the callback argument.
   */
  onChangeEvent?: TextInputProps["onChange"];
  /**
   * A function can be provided to serialize a value of any type to a string.
   *
   * This can be useful to wrap the `<SquaredInput />` component (which expects a string)
   * and create higher-level components that will automatically perform the input/output
   * conversion to other types.
   *
   * *A serializer function should always be used in conjunction with a deserializer function.*
   */
  serialize?: (value: T) => string;
  /**
   * A deserializer can be provided to convert the html input value from a string to any other type.
   *
   * *A deserializer function should always be used in conjunction with a serializer function.*
   */
  deserialize?: (value: string) => T;
  /**
   * Additional style for the container element.
   */
  containerStyle?: StyleProp<ViewStyle>;
};

const InputContainer = styled.View<Partial<CommonProps> & { focus?: boolean }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  background: ${(p) => p.theme.colors.opacityDefault.c05};
  height: 48px;
  border-radius: 8px;
  color: ${(p) => p.theme.colors.neutral.c100};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.neutral.c60};
      background: ${(p) => p.theme.colors.neutral.c30};
    `};

  ${(p) =>
    p.focus &&
    !p.error &&
    css`
      border: 1px solid ${p.theme.colors.primary.c80};
    `};

  ${(p) =>
    p.error &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.error.c50};
    `};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.neutral.c60};
      background: ${(p) => p.theme.colors.neutral.c30};
    `};
`;

const SquaredInput = styled.TextInput.attrs((p) => ({
  selectionColor: p.theme.colors.primary.c80 as ColorValue,
  color: p.theme.colors.neutral.c100,
  placeholderTextColor: p.theme.colors.neutral.c70 as ColorValue,
}))<Partial<CommonProps> & { focus?: boolean }>`
  height: 100%;
  width: 100%;
  border: 0;
  flex-shrink: 1;
  padding-top: 14px;
  padding-bottom: 14px;
  padding-left: 8px;
  padding-right: 8px;
`;

const InputErrorContainer = styled(Text)`
  color: ${(p) => p.theme.colors.error.c50};
  margin-left: 12px;
`;

export const InputRenderLeftContainer = styled(FlexBox).attrs(() => ({
  alignItems: "center",
  flexDirection: "row",
  pl: "16px",
}))``;

export const InputRenderRightContainer = styled(FlexBox).attrs(() => ({
  alignItems: "center",
  flexDirection: "row",
  pr: "16px",
}))``;

// Yes, this is dirty. If you can figure out a better way please change the code :).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IDENTITY = (_: any): any => _;

function Input<T = string>(props: InputProps<T>, ref?: any): JSX.Element {
  const {
    value,
    onChange,
    onChangeText,
    onChangeEvent,
    disabled,
    error,
    renderLeft,
    renderRight,
    serialize = IDENTITY,
    deserialize = IDENTITY,
    containerStyle,
    autoFocus,
    onFocus,
    onBlur,
    ...textInputProps
  } = props;

  const inputRef = useRef<any>();
  useImperativeHandle(ref, () => inputRef.current, [inputRef]);

  const inputValue = useMemo(() => serialize(value), [serialize, value]);

  const handleChange = useCallback(
    (value: string) => {
      onChange && onChange(deserialize(value));
      onChangeText && onChangeText(value);
    },
    [onChange, onChangeText, deserialize],
  );

  useEffect(() => {
    if (autoFocus && inputRef && inputRef.current && inputRef.current.focus)
      inputRef.current.focus();
  }, [inputRef, autoFocus]);

  const [focus, setFocus] = React.useState(false);

  return (
    <FlexBox width="100%" style={containerStyle ?? undefined}>
      <InputContainer disabled={disabled} focus={focus} error={error}>
        {typeof renderLeft === "function" ? renderLeft(props) : renderLeft}
        <SquaredInput
          ref={inputRef}
          {...textInputProps}
          value={inputValue}
          onChange={onChangeEvent}
          onChangeText={handleChange}
          editable={!disabled}
          disabled={disabled}
          error={error}
          onFocus={(e: any) => {
            setFocus(true);
            typeof onFocus === "function" && onFocus(e);
          }}
          onBlur={(e: any) => {
            setFocus(false);
            typeof onBlur === "function" && onBlur(e);
          }}
        />
        {typeof renderRight === "function" ? renderRight(props) : renderRight}
      </InputContainer>
      {!!error && !disabled && <InputErrorContainer>{error}</InputErrorContainer>}
    </FlexBox>
  );
}

export default React.forwardRef(Input) as <T>(
  props: InputProps<T> & { ref?: React.ForwardedRef<TextInput> | null },
) => ReturnType<typeof Input>;
