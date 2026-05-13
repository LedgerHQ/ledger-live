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
};

export const PnLinfoDetail = ({ title, description, value }: PnLinfoDetailProps) => (
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
      <ListItemTitle>{value}</ListItemTitle>
    </ListItemTrailing>
  </ListItem>
);
