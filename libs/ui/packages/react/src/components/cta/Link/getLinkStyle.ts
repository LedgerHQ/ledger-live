import { Theme } from "../../../styles/theme";

export function getLinkColors({
  palette,
}: Theme["colors"]): Record<
  "disabled" | "main" | "color" | "shade",
  Record<"default" | "pressed", string>
> {
  return {
    disabled: {
      default: palette.neutral.c50,
      pressed: palette.neutral.c50,
    },
    main: {
      default: palette.neutral.c100,
      pressed: palette.neutral.c80,
    },
    color: {
      default: palette.primary.c80,
      pressed: palette.primary.c70,
    },
    shade: {
      default: palette.neutral.c70,
      pressed: palette.neutral.c80,
    },
  };
}
