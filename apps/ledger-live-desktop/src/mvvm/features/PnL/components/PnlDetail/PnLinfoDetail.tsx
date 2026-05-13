import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemDescription,
  ListItemContent,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";

type PnLinfoDetailProps = {
  title: string;
  description: string;
  value: string;
  discreet?: boolean;
};

export const PnLinfoDetail = ({ title, description, value, discreet }: PnLinfoDetailProps) => {
  const displayedValue = discreet ? "***" : value;
  return (
    <ListItem className="px-0">
      <ListItemLeading>
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription className="whitespace-normal break-words">
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ListItemTitle>{displayedValue}</ListItemTitle>
      </ListItemTrailing>
    </ListItem>
  );
};
