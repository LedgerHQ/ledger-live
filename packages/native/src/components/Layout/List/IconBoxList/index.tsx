import React from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import { IconBox } from "../../../Icon";

export type IconBoxListItemProps = Omit<BaseListItemProps, "bullet"> & {
  Icon: (props: { size?: number; color?: string }) => React.ReactElement;
};

export type IconBoxListProps = Omit<BaseListProps, "items"> & {
  items: IconBoxListItemProps[];
};

export default function IconBoxList({
  items,
  ...props
}: IconBoxListProps): React.ReactElement {
  return (
    <List
      items={items.map((item) => ({
        ...item,
        bullet: <IconBox Icon={item.Icon} boxSize={48} iconSize={20} />,
      }))}
      {...props}
    />
  );
}
