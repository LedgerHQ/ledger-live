import React from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import Check from "@ledgerhq/icons-ui/native/CheckAloneMedium";
import Close from "@ledgerhq/icons-ui/native/CloseMedium";

export type TipListItemProps = Omit<BaseListItemProps, "bullet"> & {
  isPositive: boolean;
};

export type TipListProps = Omit<BaseListProps, "items"> & {
  items: TipListItemProps[];
};

export default function IconBoxList({
  items,
  ...props
}: TipListProps): React.ReactElement {
  return (
    <List
      items={items.map((item) => ({
        ...item,
        bullet: item.isPositive ? (
          <Check size={20} color={"success.c100"} />
        ) : (
          <Close size={20} color={"error.c100"} />
        ),
      }))}
      {...props}
    />
  );
}
