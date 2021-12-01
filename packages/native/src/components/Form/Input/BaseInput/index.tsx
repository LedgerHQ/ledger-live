import React, { useMemo, useCallback } from "react";
import { View, TextInput, TextInputProps, ColorValue } from "react-native";
import styled, { css } from "styled-components/native";
import Text from "../../../Text";
import FlexBox from "../../../Layout/Flex";

export type CommonProps = TextInputProps & {
  disabled?: boolean;
  error?: string;
};

export type InputProps<T = string> = Omit<CommonProps, "value" | "onChange"> & {
  renderLeft?: ((props: InputProps<T>) => React.ReactNode) | React.ReactNode;
  renderRight?: ((props: InputProps<T>) => React.ReactNode) | React.ReactNode;
  value: T;
  onChange?: (value: T) => void;
  onChangeEvent?: TextInputProps["onChange"];
  /**
   * A function can be provided to serialize a value of any type to a string.
   *
   * This can be useful to wrap the `<BaseInput />` component (which expects a string)
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
};

const InputContainer = styled.View<Partial<CommonProps> & { focus?: boolean }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  background: ${(p) => p.theme.colors.neutral.c00};
  height: 48px;
  border: ${(p) => `1px solid ${p.theme.colors.neutral.c40}`};
  border-radius: 24px;
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
      border: 1px solid ${p.theme.colors.error.c100};
    `};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.neutral.c60};
      background: ${(p) => p.theme.colors.neutral.c30};
    `};
`;

const BaseInput = styled.TextInput.attrs((p) => ({
  selectionColor: p.theme.colors.primary.c80 as ColorValue,
}))<Partial<CommonProps> & { focus?: boolean }>`
  height: 100%;
  width: 100%;
  border: 0;
  flex-shrink: 1;
  padding-top: 14px;
  padding-bottom: 14px;
  padding-left: 20px;
  padding-right: 20px;
`;

const InputErrorContainer = styled(Text)`
  color: ${(p) => p.theme.colors.error.c100};
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

function Input<T = string>(
  props: InputProps<T>,
  ref?: React.ForwardedRef<TextInput>
): JSX.Element {
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
    ...textInputProps
  } = props;

  const inputValue = useMemo(() => serialize(value), [serialize, value]);

  const handleChange = useCallback(
    (value: string) => {
      onChange && onChange(deserialize(value));
      onChangeText && onChangeText(value);
    },
    [onChange, onChangeText, deserialize]
  );

  const [focus, setFocus] = React.useState(false);

  return (
    <View style={{ display: "flex", width: "100%" }}>
      <InputContainer disabled={disabled} focus={focus} error={error}>
        {typeof renderLeft === "function" ? renderLeft(props) : renderLeft}
        <BaseInput
          ref={ref}
          {...textInputProps}
          value={inputValue}
          onChange={onChangeEvent}
          onChangeText={handleChange}
          editable={!disabled}
          disabled={disabled}
          error={error}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {typeof renderRight === "function" ? renderRight(props) : renderRight}
      </InputContainer>
      {!!error && !disabled && (
        <InputErrorContainer>{error}</InputErrorContainer>
      )}
    </View>
  );
}

export default React.forwardRef(Input) as <T>(
  props: InputProps<T> & { ref?: React.ForwardedRef<TextInput> }
) => ReturnType<typeof Input>;
