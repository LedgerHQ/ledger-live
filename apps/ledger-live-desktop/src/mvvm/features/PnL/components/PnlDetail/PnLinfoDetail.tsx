import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemTitle,
  ListItemDescription,
  ListItemContent,
  ListItemTrailing,
  Trend,
} from "@ledgerhq/lumen-ui-react";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import type { PnlDetailItem } from "./types";

export const PnLinfoDetail = ({ title, description, value, percentage }: PnlDetailItem) => {
  const discreet = useSelector(discreetModeSelector);

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
        <ListItemContent>
          <ListItemTitle>{value}</ListItemTitle>
          {percentage != null &&
            (discreet ? (
              <span className="body-3 text-muted self-end">***</span>
            ) : (
              <Trend value={percentage} size="sm" className="self-end" />
            ))}
        </ListItemContent>
      </ListItemTrailing>
    </ListItem>
  );
};
