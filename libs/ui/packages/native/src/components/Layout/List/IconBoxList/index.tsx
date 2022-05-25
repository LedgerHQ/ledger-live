import React, { useMemo } from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import { IconBox } from "../../../Icon";
import { IconType } from "../../../Icon/type";

export type IconBoxListItemProps = Omit<BaseListItemProps, "bullet"> & {
  Icon: IconType;
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
          <IconBox
            shape={iconShapes}
            variant={iconVariants}
            Icon={item.Icon}
            boxSize={48}
            iconSize={20}
          />
        ),
      })),
    [items],
  );
  return <List items={iconBoxItems} {...props} />;
}
