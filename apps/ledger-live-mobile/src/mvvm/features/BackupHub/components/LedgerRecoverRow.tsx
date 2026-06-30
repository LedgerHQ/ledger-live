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
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ShieldCheckNotificationIcon } from "./ShieldCheckNotificationIcon";

export type LedgerRecoverRowProps = {
  showCta: boolean;
  isWarning: boolean;
  showNotificationDot: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
};

export function LedgerRecoverRow({
  showCta,
  isWarning,
  showNotificationDot,
  title,
  description,
  ctaLabel,
  onPress,
}: Readonly<LedgerRecoverRowProps>) {
  return (
    <ListItem onPress={onPress} testID="backup-hub-recover-row">
      <ListItemLeading>
        <Spot
          appearance="icon"
          icon={showNotificationDot ? ShieldCheckNotificationIcon : ShieldCheck}
          size={48}
        />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription
            numberOfLines={2}
            lx={isWarning ? { color: "warning" } : undefined}
          >
            {description}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        {showCta ? (
          <Button appearance="base" size="sm" onPress={onPress} testID="backup-hub-recover-cta">
            {ctaLabel}
          </Button>
        ) : (
          <ChevronRight size={24} color="muted" />
        )}
      </ListItemTrailing>
    </ListItem>
  );
}
