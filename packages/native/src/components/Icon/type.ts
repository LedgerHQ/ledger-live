import React, { ComponentClass, FunctionComponent } from "react";

export type IconProps = { size?: number; color?: string };
export type IconType = ComponentClass<IconProps> | FunctionComponent<IconProps>;
export type IconOrElementType = IconType | React.ReactElement;
