import React from "react";

export type IconProps = { size?: number; color?: string };
export type IconType = React.ComponentType<IconProps>;
export type IconOrElementType = IconType | React.ReactElement;
