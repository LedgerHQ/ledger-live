import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ExternalLink } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

export type PhysicalBackupRowProps = {
  image: string;
  title: string;
  description: string;
  isWarning: boolean;
  onClick: () => void;
  testId?: string;
};

export function PhysicalBackupRow({
  image,
  title,
  description,
  isWarning,
  onClick,
  testId,
}: Readonly<PhysicalBackupRowProps>) {
  return (
    <ListItem onClick={onClick} data-testid={testId}>
      <ListItemLeading>
        <img src={image} alt="" className="size-48 rounded-md object-contain" />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription className={cn(isWarning && "text-warning")}>
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ExternalLink className="text-muted" />
      </ListItemTrailing>
    </ListItem>
  );
}
