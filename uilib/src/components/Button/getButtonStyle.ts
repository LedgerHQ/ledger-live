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
            backgroundColor: p.theme.colors.palette.grey.border,
            padding: `0 ${p.theme.space[4]}px`,
          }
        : {
            backgroundColor: p.theme.colors.palette.primary.base,
            padding: `0 ${p.theme.space[4]}px`,
          };
    case "secondary":
      return p.disabled
        ? {
            borderColor: p.theme.colors.palette.grey.border,
            padding: `0 ${p.theme.space[4]}px`,
          }
        : {
            borderColor: p.theme.colors.palette.grey.border,
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
            color: p.theme.colors.palette.text.tertiary,
          }
        : {
            color: p.theme.colors.palette.text.contrast,
          };
    case "secondary":
      return p.disabled
        ? {
            color: p.theme.colors.palette.grey.border,
          }
        : {
            color: p.theme.colors.palette.text.default,
          };
    default:
      return p.disabled
        ? {
            color: p.theme.colors.palette.text.tertiary,
          }
        : {
            color: p.theme.colors.palette.text.default,
          };
  }
}
