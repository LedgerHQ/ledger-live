import React, { useMemo, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import {
  TextInput,
  TextInputProps,
  ColorValue,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import styled, { css } from "styled-components/native";
import Text from "../../../Text";
import FlexBox from "../../../Layout/Flex";
import { DeleteCircleFill } from "@ledgerhq/icons-ui/native";

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
  renderLeft?:
    | ((props: InputProps<T>, ref: React.RefObject<{ clear: () => void }>) => React.ReactNode)
    | React.ReactNode;
  /**
   * A function that will render some content on the right side of the input.
   */
  renderRight?:
    | ((props: InputProps<T>, ref: React.RefObject<{ clear: () => void }>) => React.ReactNode)
    | React.ReactNode;
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
  /**
   * Additional style for the container element.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Additional style for the input container element.
   */
  inputContainerStyle?: StyleProp<ViewStyle> & TextStyle;
  /**
   * Additional style for the baseInput container element.
   */
  baseInputContainerStyle?: TextStyle;
  /**
   * Additional style for the error container element.
   */
  inputErrorContainerStyles?: StyleProp<ViewStyle>;
  inputErrorColor?: string;
  showErrorIcon?: boolean;
  hasBorder?: boolean;
  /**
   * Optional text color parameter.
   */
  color?: string;
};

const InputContainer = styled.View<Partial<CommonProps> & { focus?: boolean; hasBorder?: boolean }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  background: ${(p) => p.theme.colors.background.main};
  height: 48px;
  border: ${(p) => (p.hasBorder ? `1px solid ${p.theme.colors.opacityDefault.c20}` : "none")};
  border-radius: 8px;
  color: ${(p) => p.theme.colors.neutral.c100};
  align-items: center;
  padding: 0px 16px;

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.neutral.c60};
      background: ${(p) => p.theme.colors.neutral.c30};
    `};

  ${(p) =>
    p.focus &&
    !p.error &&
    p.hasBorder &&
    css`
      border: 1px solid ${p.theme.colors.primary.c80};
    `};

  ${(p) =>
    p.error &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.error.c60};
    `};

  ${(p) =>
    p.disabled &&
    p.hasBorder &&
    css`
      color: ${p.theme.colors.neutral.c60};
      background: ${(p) => p.theme.colors.neutral.c30};
    `};

  ${(p) =>
    p.disabled &&
    !p.hasBorder &&
    css`
      color: ${p.theme.colors.opacityDefault.c10};
      background: ${(p) => p.theme.colors.neutral.c30};
    `};
`;

const BaseInput = styled.TextInput.attrs((p) => ({
  selectionColor: p.theme.colors.primary.c80 as ColorValue,
  placeholderTextColor: p.theme.colors.neutral.c80 as ColorValue,
}))<Partial<CommonProps> & { focus?: boolean }>`
  height: 100%;
  width: 100%;
  border: 0;
  flex-shrink: 1;
  display: flex;
  min-height: fit-content;
  color: ${(p) => p.theme.colors.neutral.c100};
`;

const InputErrorText = styled(Text)`
  color: ${(p) => p.theme.colors.error.c60};
`;

export const InputRenderLeftContainer = styled(FlexBox).attrs(() => ({
  alignItems: "center",
  flexDirection: "row",
  paddingRight: "8px",
}))``;

export const InputRenderRightContainer = styled(FlexBox).attrs(() => ({
  alignItems: "center",
  flexDirection: "row",
  paddingLeft: "8px",
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
    hasBorder = true,
    inputContainerStyle,
    baseInputContainerStyle,
    inputErrorContainerStyles,
    autoFocus,
    onFocus,
    onBlur,
    color,
    inputErrorColor = "error.c50",
    showErrorIcon = false,
    ...textInputProps
  } = props;

  const inputRef = useRef<any>();
  useImperativeHandle(ref, () => inputRef.current, [inputRef]);

  const inputValue = useMemo(() => serialize(value), [serialize, value]);

  const handleChange = useCallback(
    (value: string) => {
      onChange?.(deserialize(value));
      onChangeText?.(value);
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
      <InputContainer
        disabled={disabled}
        focus={focus}
        hasBorder={hasBorder}
        error={error}
        style={inputContainerStyle}
      >
        {typeof renderLeft === "function" ? renderLeft(props, inputRef) : renderLeft}
        <BaseInput
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
            onFocus?.(e);
          }}
          onBlur={(e: any) => {
            setFocus(false);
            onBlur?.(e);
          }}
          style={{ ...(color ? { color: color } : {}), ...baseInputContainerStyle }}
        />
        {typeof renderRight === "function" ? renderRight(props, inputRef) : renderRight}
      </InputContainer>
      {!!error && !disabled && (
        <FlexBox
          flexDirection="row"
          alignItems="center"
          style={inputErrorContainerStyles as ViewStyle}
        >
          {showErrorIcon && <DeleteCircleFill color={inputErrorColor} size="S" />}
          <InputErrorText color={inputErrorColor} variant="small" mt={3}>
            {error}
          </InputErrorText>
        </FlexBox>
      )}
    </FlexBox>
  );
}

export default React.forwardRef(Input) as <T>(
  props: InputProps<T> & { ref?: React.ForwardedRef<TextInput> | null },
) => ReturnType<typeof Input>;
