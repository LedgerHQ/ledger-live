import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import Text from "../../../Text";
import { IconType } from "src/components/Icon/type";
import baseStyled, { BaseStyledProps } from "../../../styled";

export type QuickActionButtonProps = TouchableOpacityProps &
  BaseStyledProps & {
    Icon: IconType;
    iconPosition?: "right" | "left";
    disabled?: boolean;
  };

export const Base = baseStyled(TouchableOpacity)`
  height: 80px;
  flex-direction: column;
  text-align: center;
  align-items: center;
  justify-content: center;
  border-radius: ${(p) => p.theme.radii[2]}px;
  padding: 0 ${(p) => p.theme.space[6]}px;
  ${({ disabled, theme }) =>
    disabled
      ? `border: 1px solid ${theme.colors.neutral.c30};`
      : `background-color: ${theme.colors.neutral.c20};`}
`;

const QuickActionButton = ({
  Icon,
  children,
  disabled,
  ...otherProps
}: QuickActionButtonProps): React.ReactElement => {
  return (
    <Base disabled={disabled} {...otherProps}>
      <Icon size={24} color={disabled ? "neutral.c50" : "neutral.c100"} />
      <Text
        variant={"body"}
        fontWeight={"semiBold"}
        color={disabled ? "neutral.c50" : "neutral.c100"}
        mt={2}
      >
        {children}
      </Text>
    </Base>
  );
};

export default QuickActionButton;
