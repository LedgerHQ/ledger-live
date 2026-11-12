import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Spot,
  Tag,
} from "@ledgerhq/lumen-ui-rnative";
import { Robot } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ManageAgentsCardProps } from "./ManageAgentsCard.types";

export function ManageAgentsCard({
  title,
  description,
  newBadgeLabel,
  onOpen,
  testID = "manage-agents-card",
}: ManageAgentsCardProps) {
  return (
    <Card type="interactive" onPress={onOpen} testID={testID}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Robot} size={48} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
        {newBadgeLabel ? (
          <CardTrailing>
            <Tag
              label={newBadgeLabel}
              appearance="accent"
              size="md"
              testID={`${testID}-new-badge`}
            />
          </CardTrailing>
        ) : null}
      </CardHeader>
    </Card>
  );
}
