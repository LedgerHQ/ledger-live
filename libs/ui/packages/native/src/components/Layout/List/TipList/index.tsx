import React, { useMemo } from "react";
import List, { BaseListItemProps, BaseListProps } from "../List";
import Check from "@ledgerhq/icons-ui/native/CheckAloneMedium";
import Close from "@ledgerhq/icons-ui/native/CloseMedium";

export type TipListItemProps = Omit<BaseListItemProps, "bullet"> & {
  isPositive: boolean;
};

export type TipListProps = Omit<BaseListProps, "items"> & {
  items: TipListItemProps[];
};

export default function TipList({ items, ...props }: TipListProps): React.ReactElement {
  const tipItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        bullet: item.isPositive ? (
          <Check size={20} color={"success.c50"} />
        ) : (
          <Close size={20} color={"error.c50"} />
        ),
      })),
    [items],
  );
  return <List items={tipItems} {...props} />;
}
