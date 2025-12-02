import React, { useContext, useState } from "react";
import type { JSX } from "react";
import { BlurEvent, FocusEvent, TextInput, View } from "react-native";
import styled, { DefaultTheme, ThemeContext } from "styled-components/native";
import { Tokens, useTokens } from "../../libs";

export type IconProps = {
  size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  color?: string;
  style?: object;
};

type Props = React.ComponentProps<typeof TextInput> & {
  icon?: ({ size }: IconProps) => JSX.Element;
};

const Wrapper = styled(View)<{ tokens: Tokens; isFocused: boolean }>`
  height: 40px;
  min-width: 328px;
  padding-left: ${({ isFocused, tokens }) =>
    isFocused ? Number(tokens["spacing-s"]) - 2 : Number(tokens["spacing-s"])}px;
  padding-right: ${({ isFocused, tokens }) =>
    isFocused ? Number(tokens["spacing-s"]) - 2 : Number(tokens["spacing-s"])}px;
  align-items: center;
  flex-direction: row;
  gap: ${({ tokens }) => tokens["spacing-xxs"]}px;
  border-radius: ${({ tokens }) => tokens["radius-s"]}px;
  background-color: ${({ tokens }) => tokens["colors-surface-transparent-subdued-default"]};
  overflow: hidden;
  color: ${({ tokens }) => tokens["colors-content-subdued-default-default"]};
  border-width: ${({ isFocused }) => (isFocused ? "2px" : "0px")};
  border-color: ${({ isFocused, tokens }) =>
    isFocused ? tokens["colors-border-active"] : "transparent"};
`;

const StyledInput = styled(TextInput)<{ tokens: Tokens }>`
  flex: 1;
  background-color: transparent;
  border-width: 0;
  color: ${({ tokens }) => tokens["colors-content-subdued-default-default"]};
`;

const TOKEN_KEYS = [
  "spacing-s",
  "spacing-xxs",
  "radius-s",
  "colors-surface-transparent-subdued-default",
  "colors-content-subdued-default-default",
  "colors-border-active",
] as const;

export const Input = React.forwardRef<TextInput, Props>(
  ({ icon: Icon, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const theme = useContext(ThemeContext);
    const themeType = (theme?.colors?.type as DefaultTheme["theme"]) ?? "light";

    const tokens = useTokens(themeType, [...TOKEN_KEYS]);

    const handleFocus = (e: FocusEvent) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: BlurEvent) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <Wrapper tokens={tokens} isFocused={isFocused}>
        {!!Icon && <Icon color={String(tokens["colors-content-subdued-default-default"])} />}
        <StyledInput
          {...props}
          ref={ref}
          tokens={tokens}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={String(tokens["colors-content-subdued-default-default"])}
        />
      </Wrapper>
    );
  },
);

Input.displayName = "Input";
