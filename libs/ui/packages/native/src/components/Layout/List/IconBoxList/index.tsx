import React, { useMemo } from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import BoxedIcon from "../../../Icon/BoxedIcon";
import { IconOrElementType } from "src/components/Icon/type";

export type IconBoxListItemProps = Omit<BaseListItemProps, "bullet"> & {
  Icon: IconOrElementType;
};

export type IconBoxListProps = Omit<BaseListProps, "items"> & {
  items: IconBoxListItemProps[];
  iconVariants?: "outlined" | "plain";
  iconShapes?: "square" | "circle";
};

export default function IconBoxList({
  items,
  iconVariants,
  iconShapes,
  ...props
}: IconBoxListProps): React.ReactElement {
  const iconBoxItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        bullet: (
          <BoxedIcon
            variant={iconShapes}
            iconColor={iconVariants === "plain" ? "primary.c70" : undefined}
            backgroundColor={iconVariants === "plain" ? "primary.c10" : undefined}
            borderColor={iconVariants === "plain" ? "transparent" : undefined}
            Icon={item.Icon}
            iconSize={20}
          />
        ),
      })),
    [items],
  );
  return <List items={iconBoxItems} {...props} />;
}
