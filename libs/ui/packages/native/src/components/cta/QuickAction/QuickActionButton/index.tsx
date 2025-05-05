import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import Text from "../../../Text";
import { IconType } from "src/components/Icon/type";
import baseStyled, { BaseStyledProps } from "../../../styled";
import { TextVariants } from "../../../../styles/theme";

type Variant = "small" | "large";

export type QuickActionButtonProps = TouchableOpacityProps &
  BaseStyledProps & {
    Icon: IconType;
    disabled?: boolean;
    onPressWhenDisabled?: TouchableOpacityProps["onPress"];
    textVariant?: TextVariants;
    variant?: Variant;
    isActive?: boolean;
  };

export const StyledText = baseStyled(Text)`
  overflow: hidden;
  max-width: 100%;
`;

export const Base = baseStyled(TouchableOpacity)<
  TouchableOpacityProps & { visuallyDisabled?: boolean; variant: Variant; isActive?: boolean }
>`
  height: ${({ variant }) => (variant === "small" ? 59 : 80)}px;
  flex-direction: column;
  text-align: center;
  align-items: center;
  justify-content: center;
  border-radius: ${({ isActive, theme }) => (isActive ? 14 : theme.radii[2])}px;
  padding: ${({ theme, variant }) =>
    variant === "small" ? `${theme.space[3]}px ${theme.space[2]}px` : `0 ${theme.space[6]}px`};
  ${({ visuallyDisabled, isActive, theme }) => {
    if (visuallyDisabled) {
      return `border: 1px solid ${theme.colors.neutral.c30};`;
    } else if (isActive) {
      return `background-color: ${theme.colors.neutral.c30};`;
    } else {
      return `background-color: ${theme.colors.neutral.c20};`;
    }
  }}
`;

const QuickActionButton = ({
  Icon,
  children,
  disabled,
  onPress,
  onPressWhenDisabled,
  textVariant = "body",
  variant = "large",
  testID,
  isActive = true,
  ...otherProps
}: QuickActionButtonProps): React.ReactElement => {
  const text = // Extract the text to use it as a testID
    React.isValidElement(children) && children.props?.i18nKey
      ? children.props.i18nKey.split(".").pop() // Extract the last part of the key
      : children?.toString().toLowerCase();
  return (
    <Base
      disabled={onPressWhenDisabled ? false : disabled}
      onPress={disabled ? onPressWhenDisabled : onPress}
      visuallyDisabled={disabled}
      variant={variant}
      isActive={!disabled && isActive}
      {...otherProps}
      testID={`${testID}-${text}`}
    >
      <Icon
        size={variant === "small" ? 20 : 24}
        color={disabled ? "neutral.c50" : "neutral.c100"}
      />
      <StyledText
        numberOfLines={1}
        variant={textVariant}
        fontWeight={"semiBold"}
        color={disabled ? "neutral.c50" : "neutral.c100"}
        mt={2}
      >
        {children}
      </StyledText>
    </Base>
  );
};

export default QuickActionButton;
