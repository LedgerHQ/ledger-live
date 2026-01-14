import { Theme } from "../../../styles/theme";

export function getLinkColors(
  colors: Theme["colors"],
): Record<"disabled" | "main" | "color" | "shade", Record<"default" | "pressed", string>> {
  return {
    disabled: {
      default: colors.neutral.c50,
      pressed: colors.neutral.c50,
    },
    main: {
      default: colors.neutral.c100,
      pressed: colors.neutral.c80,
    },
    color: {
      default: colors.primary.c80,
      pressed: colors.primary.c70,
    },
    shade: {
      default: colors.neutral.c70,
      pressed: colors.neutral.c80,
    },
  };
}
