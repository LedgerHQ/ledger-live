/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Theme } from "@ui/styles/theme";

export type ButtonTypes = "primary" | "secondary";

export default function getButtonStyle(p: {
  type?: ButtonTypes;
  disabled?: boolean;
  theme: Theme;
}): {
  backgroundColor?: string;
  borderColor?: string;
  padding?: string;
} {
  switch (p.type) {
    case "primary":
      return p.disabled
        ? {
            backgroundColor: p.theme.colors.palette.neutral.c40,
            padding: `0 ${p.theme.space[4]}px`,
          }
        : {
            backgroundColor: p.theme.colors.palette.primary.c100,
            padding: `0 ${p.theme.space[4]}px`,
          };
    case "secondary":
      return p.disabled
        ? {
            borderColor: p.theme.colors.palette.neutral.c40,
            padding: `0 ${p.theme.space[4]}px`,
          }
        : {
            borderColor: p.theme.colors.palette.neutral.c40,
            padding: `0 ${p.theme.space[4]}px`,
          };
    default:
      return {};
  }
}

export function getButtonColor(p: {
  type?: ButtonTypes | undefined;
  disabled?: boolean;
  theme: Theme;
}): {
  color: string;
} {
  switch (p.type) {
    case "primary":
      return p.disabled
        ? {
            color: p.theme.colors.palette.neutral.c70,
          }
        : {
            color: p.theme.colors.palette.neutral.c00,
          };
    case "secondary":
      return p.disabled
        ? {
            color: p.theme.colors.palette.neutral.c40,
          }
        : {
            color: p.theme.colors.palette.neutral.c100,
          };
    default:
      return p.disabled
        ? {
            color: p.theme.colors.palette.neutral.c70,
          }
        : {
            color: p.theme.colors.palette.neutral.c100,
          };
  }
}
