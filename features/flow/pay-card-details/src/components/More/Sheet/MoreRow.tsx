import React from "react";
import {
  MoreIcon,
  MoreListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
} from "./MoreRowParts";
import type { MoreRow as MoreRowModel } from "../types";

type MoreRowProps = Readonly<{ row: MoreRowModel }>;

export function MoreRow({ row }: MoreRowProps) {
  return (
    <MoreListItem rowId={row.id} onPress={row.onPress}>
      <ListItemLeading>
        <MoreIcon rowId={row.id} />
        <ListItemContent>
          <ListItemTitle>{row.title}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </MoreListItem>
  );
}
