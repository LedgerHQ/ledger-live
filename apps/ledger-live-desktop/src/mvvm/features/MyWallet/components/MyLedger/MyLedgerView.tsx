import React from "react";
import {
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  ListItemDescription,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { DeviceIconComponent } from "LLD/utils/getDeviceIcon";

export type MyLedgerViewProps = {
  title: string;
  description: string;
  icon: DeviceIconComponent;
  onClick: () => void;
};

export function MyLedgerView({ title, description, icon, onClick }: MyLedgerViewProps) {
  return (
    <ListItem onClick={onClick} className="bg-surface">
      <ListItemLeading>
        <Spot icon={icon} appearance="icon" />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{description}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
