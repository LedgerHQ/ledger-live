import React from "react";
import {
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, ShieldCheck } from "@ledgerhq/lumen-ui-react/symbols";
import { ShieldCheckNotificationIcon } from "./ShieldCheckNotificationIcon";
import { cn } from "LLD/utils/cn";

export type LedgerRecoverRowProps = {
  showCta: boolean;
  isWarning: boolean;
  showNotificationDot: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  onClick: () => void;
};

export function LedgerRecoverRow({
  showCta,
  isWarning,
  showNotificationDot,
  title,
  description,
  ctaLabel,
  onClick,
}: Readonly<LedgerRecoverRowProps>) {
  return (
    <ListItem
      onClick={onClick}
      className="bg-surface h-auto min-h-[64px] py-12"
      data-testid="backup-hub-recover-row"
    >
      <ListItemLeading>
        <Spot
          appearance="icon"
          icon={showNotificationDot ? ShieldCheckNotificationIcon : ShieldCheck}
        />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription
            className={cn("whitespace-normal text-clip", isWarning && "text-warning")}
          >
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        {showCta ? (
          <Button appearance="base" size="sm" onClick={onClick}>
            {ctaLabel}
          </Button>
        ) : (
          <ChevronRight className="text-muted" />
        )}
      </ListItemTrailing>
    </ListItem>
  );
}
