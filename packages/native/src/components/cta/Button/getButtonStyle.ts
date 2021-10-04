import { Theme } from "@ui/styles/theme";
import { ButtonProps } from "@components/cta/Button/index";
import { TextTypes } from "@components/Text/getTextStyle";

const buttonColors: {
  [index: string]: {
    primaryColor: string;
    secondaryColor: string;
  };
} = {
  disabled: {
    primaryColor: "palette.neutral.c50",
    secondaryColor: "palette.neutral.c30",
  },
  main: {
    primaryColor: "palette.neutral.c00",
    secondaryColor: "palette.neutral.c100",
  },
  error: {
    primaryColor: "palette.neutral.c00",
    secondaryColor: "palette.error.c100",
  },
  color: {
    primaryColor: "palette.neutral.c00",
    secondaryColor: "palette.primary.c80",
  },
};

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
  const { primaryColor, secondaryColor } =
    buttonColors[disabled ? "disabled" : type];

  if (outline) {
    return {
      text: { color: disabled ? primaryColor : secondaryColor },
      button: {
        backgroundColor: "transparent",
        borderColor: disabled ? primaryColor : secondaryColor,
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
