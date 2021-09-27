import React from "react";
import { View, TextInputProps } from "react-native";
import styled, { css } from "styled-components/native";
import Text from "@components/Text";
import FlexBox from "@components/Layout/Flex";

type CommonProps = TextInputProps & {
  disabled?: boolean;
  error?: string;
};

export type InputProps = CommonProps & {
  renderLeft?: ((props: CommonProps) => React.ReactNode) | React.ReactNode;
  renderRight?: ((props: CommonProps) => React.ReactNode) | React.ReactNode;
};

const InputContainer = styled.View<Partial<CommonProps> & { focus?: boolean }>`
  display: flex;
  flex-direction: row;
  width: 100%;
  background: ${(p) => p.theme.colors.palette.neutral.c00};
  height: 48px;
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 24px;
  color: ${(p) => p.theme.colors.palette.neutral.c100};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.palette.neutral.c60};
      background: ${(p) => p.theme.colors.palette.neutral.c30};
    `};

  ${(p) =>
    p.focus &&
    !p.error &&
    css`
      border: 1px solid ${p.theme.colors.palette.primary.c140};
    `};

  ${(p) =>
    p.error &&
    !p.disabled &&
    css`
      border: 1px solid ${p.theme.colors.palette.error.c100};
    `};

  ${(p) =>
    p.disabled &&
    css`
      color: ${p.theme.colors.palette.neutral.c60};
      background: ${(p) => p.theme.colors.palette.neutral.c30};
    `};
`;

const BaseInput = styled.TextInput.attrs((p) => ({
  selectionColor: p.theme.colors.palette.primary.c140,
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

const InputErrorContainer = styled(Text).attrs(() => ({ type: "small3" }))`
  color: ${(p) => p.theme.colors.palette.error.c100};
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

export default function Input(props: InputProps): JSX.Element {
  const { value, disabled, error, renderLeft, renderRight, ...textInputProps } =
    props;

  const [focus, setFocus] = React.useState(false);

  return (
    <View style={{ display: "flex", width: "100%" }}>
      <InputContainer disabled={disabled} focus={focus} error={error}>
        {typeof renderLeft === "function" ? renderLeft(props) : renderLeft}
        <BaseInput
          {...textInputProps}
          editable={!disabled}
          disabled={disabled}
          error={error}
          value={value}
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
