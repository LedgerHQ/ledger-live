import React, { useMemo } from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import { IconBox } from "../../../Icon";
import { IconType } from "../../../Icon/type";

export type IconBoxListItemProps = Omit<BaseListItemProps, "bullet"> & {
  Icon: IconType;
};

export type IconBoxListProps = Omit<BaseListProps, "items"> & {
  items: IconBoxListItemProps[];
};

export default function IconBoxList({ items, ...props }: IconBoxListProps): React.ReactElement {
  const iconBoxItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        bullet: <IconBox Icon={item.Icon} boxSize={48} iconSize={20} />,
      })),
    [items],
  );
  return <List items={iconBoxItems} {...props} />;
}
