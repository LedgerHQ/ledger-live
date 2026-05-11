import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";

export type PricePerformanceListRowProps = Readonly<{
  leadingTitle: string;
  leadingDescription?: string;
  trailingTitle: string;
  trailingDescription?: string;
}>;

export function PricePerformanceListRow({
  leadingTitle,
  leadingDescription,
  trailingTitle,
  trailingDescription,
}: PricePerformanceListRowProps) {
  return (
    <ListItem density="compact" className="pointer-events-none px-0">
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle className="font-normal text-muted">{leadingTitle}</ListItemTitle>
          {leadingDescription ? (
            <ListItemDescription>{leadingDescription}</ListItemDescription>
          ) : null}
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemContent className="items-end text-end">
          <ListItemTitle>{trailingTitle}</ListItemTitle>
          {trailingDescription ? (
            <ListItemDescription>{trailingDescription}</ListItemDescription>
          ) : null}
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
}
