import { Theme } from "../../../styles/theme";

export function getLinkColors(colors: Theme["colors"]): {
  [index: string]: {
    disabled: string;
    main: string;
    color: string;
    shade: string;
  };
} {
  return {
    default: {
      disabled: colors.neutral.c50,
      main: colors.neutral.c100,
      color: colors.primary.c80,
      shade: colors.neutral.c70,
    },
    reversed: {
      disabled: colors.neutral.c80,
      main: colors.neutral.c00,
      color: colors.primary.c60,
      shade: colors.neutral.c50,
    },
  };
}
