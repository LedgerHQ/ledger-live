import { Theme } from "@ui/styles/theme";
import { ButtonProps } from "@components/cta/Button/index";

export function getButtonColors(colors: Theme["colors"]): {
  [index: string]: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor?: string;
  };
} {
  return {
    disabled: {
      primaryColor: colors.palette.neutral.c50,
      secondaryColor: colors.palette.neutral.c30,
    },
    main: {
      primaryColor: colors.palette.neutral.c00,
      secondaryColor: colors.palette.neutral.c100,
    },
    shade: {
      primaryColor: colors.palette.neutral.c00,
      secondaryColor: colors.palette.neutral.c100,
      tertiaryColor: colors.palette.neutral.c40,
    },
    error: {
      primaryColor: colors.palette.neutral.c00,
      secondaryColor: colors.palette.error.c100,
    },
    color: {
      primaryColor: colors.palette.neutral.c00,
      secondaryColor: colors.palette.primary.c80,
    },
  };
}

export function getButtonColorStyle(
  colors: Theme["colors"],
  props: ButtonProps
): {
  text: {
    color: string;
  };
  button: {
    backgroundColor: string;
    borderColor?: string;
    borderWidth?: number;
  };
} {
  const { outline, type = "main", disabled } = props;

  const { primaryColor, secondaryColor, tertiaryColor } =
    getButtonColors(colors)[disabled ? "disabled" : type];

  if (outline) {
    return {
      text: { color: disabled ? primaryColor : secondaryColor },
      button: {
        backgroundColor: "transparent",
        borderColor: disabled ? primaryColor : tertiaryColor ?? secondaryColor,
        borderWidth: 1,
      },
    };
  } else {
    return {
      text: { color: primaryColor },
      button: {
        backgroundColor: secondaryColor,
      },
    };
  }
}

export const buttonSizeStyle: {
  [index: string]: {
    padding: string;
    height: string;
  };
} = {
  small: {
    padding: "0 20px",
    height: "40px",
  },
  medium: {
    padding: "0 24px",
    height: "48px",
  },
  large: {
    padding: "0 28px",
    height: "56px",
  },
};
