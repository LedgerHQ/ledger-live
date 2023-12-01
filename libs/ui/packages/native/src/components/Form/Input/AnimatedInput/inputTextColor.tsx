import { Theme } from "src/styles/theme";

export type CbThemeType = {
  theme: Theme;
};

export const inputStatusColors = {
  default: ({ theme }: CbThemeType) => theme.colors.opacityDefault.c50,
  focused: ({ theme }: CbThemeType) => theme.colors.primary.c80,
  filled: ({ theme }: CbThemeType) => theme.colors.neutral.c60,
  error: ({ theme }: CbThemeType) => theme.colors.error.c70,
};

export const inputTextColor = {
  default: ({ theme }: CbThemeType) => theme.colors.opacityDefault.c70,
  focused: ({ theme }: CbThemeType) => theme.colors.neutral.c100,
  filled: ({ theme }: CbThemeType) => theme.colors.neutral.c100,
  error: ({ theme }: CbThemeType) => theme.colors.neutral.c100,
};

export const inputBackgroundColor = {
  default: ({ theme }: CbThemeType) => theme.colors.background.main,
  focused: ({ theme }: CbThemeType) => theme.colors.background.main,
  filled: ({ theme }: CbThemeType) => theme.colors.background.main,
  error: ({ theme }: CbThemeType) => theme.colors.background.main,
};

type getInputStatusProps = {
  focused?: boolean;
  hasValue?: boolean;
  hasError?: boolean;
};

export const getInputStatus = ({ focused, hasValue, hasError }: getInputStatusProps) => {
  if (hasError) return "error";
  if (focused) return "focused";
  if (hasValue) return "filled";
  return "default";
};
