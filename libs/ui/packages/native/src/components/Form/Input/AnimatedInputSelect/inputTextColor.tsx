import { Theme } from "src/styles/theme";

type CbThemeType = {
  theme: Theme;
};

export const inputStatusColors = {
  default: ({ theme }: CbThemeType) => theme.colors.opacityDefault.c50,
  focused: ({ theme }: CbThemeType) => theme.colors.primary.c80,
  filled: ({ theme }: CbThemeType) => theme.colors.neutral.c60,
  error: ({ theme }: CbThemeType) => theme.colors.error.c50,
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
