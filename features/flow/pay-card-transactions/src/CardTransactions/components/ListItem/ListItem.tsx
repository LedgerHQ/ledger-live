import React from "react";
import { ListItemView } from "./ListItemView";
import { useListItemViewModel } from "./useListItemViewModel";
import type { ListItemProps } from "./ListItem.types";

export function ListItem(props: ListItemProps) {
  return <ListItemView {...useListItemViewModel(props)} />;
}
