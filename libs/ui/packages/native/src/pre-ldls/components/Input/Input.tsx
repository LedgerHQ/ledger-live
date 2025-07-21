import React, { useContext } from "react";
import { TextInput, View } from "react-native";
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

const Wrapper = styled(View)<{ tokens: Tokens }>`
  height: 40px;
  min-width: 328px;
  padding-horizontal: ${({ tokens }) => tokens["spacing-s"]}px;
  align-items: center;
  flex-direction: row;
  gap: ${({ tokens }) => tokens["spacing-xxs"]}px;
  border-radius: ${({ tokens }) => tokens["radius-s"]}px;
  background-color: ${({ tokens }) => tokens["colors-surface-transparent-subdued-default"]};
  overflow: hidden;
  color: ${({ tokens }) => tokens["colors-content-subdued-default-default"]};
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
] as const;

export const Input = React.forwardRef<TextInput, Props>(({ icon: Icon, ...props }, ref) => {
  const theme = useContext(ThemeContext);
  const themeType = (theme?.colors?.type as DefaultTheme["theme"]) ?? "light";

  const tokens = useTokens(themeType, [...TOKEN_KEYS]);

  return (
    <Wrapper tokens={tokens}>
      {!!Icon && <Icon color={String(tokens["colors-content-subdued-default-default"])} />}
      <StyledInput {...props} ref={ref} tokens={tokens} />
    </Wrapper>
  );
});

Input.displayName = "Input";
