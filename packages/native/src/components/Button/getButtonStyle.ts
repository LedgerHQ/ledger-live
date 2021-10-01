import { Theme } from "@ui/styles/theme";
import { ButtonProps } from "@components/Button/index";
import { TextTypes } from "@components/Text/getTextStyle";

function getButtonColors(
  colors: Theme["colors"],
  props: ButtonProps
): {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
} {
  const { type, disabled, pressed, outline } = props;

  const { palette } = colors;

  const primaryColor = palette.neutral.c00;
  let secondaryColor;
  let tertiaryColor;

  const disabledColors = {
    primaryColor: palette.neutral.c50,
    secondaryColor: outline ? palette.neutral.c50 : palette.neutral.c30,
  };

  switch (type) {
    case "main":
      if (disabled) {
        return disabledColors;
      } else if (pressed && !outline) {
        secondaryColor = palette.neutral.c80;
      } else {
        secondaryColor = palette.neutral.c100;
        tertiaryColor = palette.neutral.c30;
      }
      break;
    case "error":
      if (disabled) {
        return disabledColors;
      } else if (pressed && !outline) {
        secondaryColor = palette.error.c60;
      } else {
        secondaryColor = palette.error.c100;
        tertiaryColor = palette.error.c30;
      }
      break;
    case "color":
    default:
      if (disabled) {
        return disabledColors;
      } else if (pressed && !outline) {
        secondaryColor = palette.primary.c70;
      } else {
        secondaryColor = palette.primary.c80;
        tertiaryColor = palette.primary.c20;
      }
      break;
  }

  return {
    primaryColor,
    secondaryColor,
    tertiaryColor,
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
  const { outline, pressed } = props;
  const { primaryColor, secondaryColor, tertiaryColor } = getButtonColors(
    colors,
    props
  );

  if (outline) {
    return {
      text: { color: secondaryColor },
      button: {
        backgroundColor:
          pressed && tertiaryColor ? tertiaryColor : "transparent",
        borderColor: secondaryColor,
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

export function getButtonSizeStyle({ size }: ButtonProps): {
  padding: string;
  height: string;
} {
  switch (size) {
    case "small":
      return {
        padding: "0 20px",
        height: "40px",
      };
    default:
    case "medium":
      return {
        padding: "0 24px",
        height: "48px",
      };
    case "large":
      return {
        padding: "0 28px",
        height: "56px",
      };
  }
}

export const buttonSizeTextType: { [index: string]: TextTypes } = {
  small: "paragraph",
  medium: "body",
  large: "large",
};

export const buttonIconSize: { [index: string]: number } = {
  small: 16,
  medium: 18,
  large: 20,
};
