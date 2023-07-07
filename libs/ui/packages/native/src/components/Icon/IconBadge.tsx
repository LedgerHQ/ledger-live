import React from "react";
import Flex, { FlexBoxProps } from "../Layout/Flex";
import { IconOrElementType } from "./type";

export const DEFAULT_ICON_SIZE = 16;
export const DEFAULT_BACKGROUND_COLOR = "neutral.c40";
const BORDER_RADIUS = 999999;

export type IconBadgeProps = FlexBoxProps & {
  /**
   * Component that takes `{size?: number; color?: string}` as props.
   * Will be rendered at the top right with the size provided in `iconSize` or a default size.
   */
  Icon: IconOrElementType;
  /**
   * Icon size, will be applied to the component provided in the `Icon` prop
   */
  iconSize: number;
  /**
   * Icon color, will be applied to the component provided in the `Icon` prop
   */
  iconColor?: string;
  /**
   * Background color, will define the color of the round background part of the badge
   */
  backgroundColor?: string;
};

const IconBadge = ({
  Icon,
  iconSize = DEFAULT_ICON_SIZE,
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
  iconColor,
  ...rest
}: IconBadgeProps) => {
  return (
    <Flex
      height={iconSize * 2}
      width={iconSize * 2}
      backgroundColor={backgroundColor}
      borderRadius={BORDER_RADIUS}
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      {React.isValidElement(Icon) ? (
        Icon
      ) : (
        /* @ts-expect-error TS 5 can't seem to be able to prove this is a react comopnent here */
        <Icon size={iconSize} color={iconColor} />
      )}
    </Flex>
  );
};

export default IconBadge;
