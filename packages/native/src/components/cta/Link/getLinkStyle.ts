import { Theme } from "../../../styles/theme";

export function getLinkColors(
  colors: Theme["colors"]
): {
  [index: string]: {
    disabled: string;
    main: string;
    color: string;
    shade: string;
  };
} {
  return {
    default: {
      disabled: colors.palette.neutral.c50,
      main: colors.palette.neutral.c100,
      color: colors.palette.primary.c80,
      shade: colors.palette.neutral.c70,
    },
    reversed: {
      disabled: colors.palette.neutral.c80,
      main: colors.palette.neutral.c00,
      color: colors.palette.primary.c60,
      shade: colors.palette.neutral.c50,
    },
  };
}
