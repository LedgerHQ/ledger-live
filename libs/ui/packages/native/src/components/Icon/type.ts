import React from "react";

export type IconProps = { size?: number; color?: string };
export type IconType = React.ComponentType<IconProps>;

export type NewIconProps = { size?: "XS" | "S" | "M" | "L" | "XL"; color?: string; style?: object };
export type NewIconType = React.ComponentType<NewIconProps>;

export type IconOrElementType = IconType | React.ReactElement;
export type NewIconOrElementType = NewIconType | React.ReactElement;
