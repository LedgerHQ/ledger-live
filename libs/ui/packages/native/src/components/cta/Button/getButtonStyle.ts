import { Theme } from "../../../styles/theme";
import { ButtonProps } from "./index";

export function getButtonColors(colors: Theme["colors"]): {
  [index: string]: {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor?: string;
    pressedColor?: string;
    pressedOutlineColor?: string;
  };
} {
  return {
    default: {
      primaryColor: colors.neutral.c100,
      secondaryColor: "rgba(0,0,255,0)",
      pressedColor: "transparent",
      pressedOutlineColor: "transparent",
    },
    disabled: {
      primaryColor: colors.neutral.c50,
      secondaryColor: colors.neutral.c30,
    },
    main: {
      primaryColor: colors.neutral.c00,
      secondaryColor: colors.neutral.c100,
      pressedColor: colors.opacityDefault.c60,
      pressedOutlineColor: colors.opacityDefault.c10,
    },
    shade: {
      primaryColor: colors.neutral.c00,
      secondaryColor: colors.neutral.c100,
      tertiaryColor: colors.neutral.c40,
      pressedColor: colors.opacityDefault.c60,
      pressedOutlineColor: colors.opacityDefault.c10,
    },
    error: {
      primaryColor: colors.neutral.c00,
      secondaryColor: colors.error.c50,
      pressedColor: colors.error.c50a07,
      pressedOutlineColor: colors.error.c50a025,
    },
    color: {
      primaryColor: colors.neutral.c00,
      secondaryColor: colors.primary.c80,
      pressedColor: colors.primary.c80a70,
      pressedOutlineColor: colors.primary.c70a025,
    },
  };
}

export function getButtonColorStyle(
  colors: Theme["colors"],
  props: ButtonProps,
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

  const { primaryColor, secondaryColor, tertiaryColor, pressedColor, pressedOutlineColor } =
    getButtonColors(colors)[disabled ? "disabled" : type];

  if (outline) {
    return {
      text: { color: disabled ? primaryColor : secondaryColor },
      button: {
        backgroundColor: "transparent",
        borderColor: disabled ? primaryColor : tertiaryColor ?? secondaryColor,
        borderWidth: 1,
        ...(pressedOutlineColor && { underlayColor: pressedOutlineColor }),
      },
    };
  } else {
    return {
      text: { color: primaryColor },
      button: {
        backgroundColor: secondaryColor,
        ...(pressedColor && { underlayColor: pressedColor }),
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
