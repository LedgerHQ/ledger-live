import React from "react";
import Flex, { FlexBoxProps } from "../Layout/Flex";
import { IconOrElementType } from "./type";

export const DEFAULT_ICON_SIZE = 16;
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
};

const IconBadge = ({ Icon, iconSize = DEFAULT_ICON_SIZE, iconColor, ...rest }: IconBadgeProps) => {
  return (
    <Flex
      height={iconSize * 2}
      width={iconSize * 2}
      backgroundColor="neutral.c40"
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
