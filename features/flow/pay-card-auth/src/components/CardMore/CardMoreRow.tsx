import React from "react";
import {
  CardMoreIcon,
  CardMoreListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
} from "./CardMoreRowParts";
import type { CardMoreRow as CardMoreRowModel } from "./types";

type CardMoreRowProps = Readonly<{ row: CardMoreRowModel }>;

export function CardMoreRow({ row }: CardMoreRowProps) {
  return (
    <CardMoreListItem rowId={row.id} onPress={row.onPress}>
      <ListItemLeading>
        <CardMoreIcon rowId={row.id} />
        <ListItemContent>
          <ListItemTitle>{row.title}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </CardMoreListItem>
  );
}
