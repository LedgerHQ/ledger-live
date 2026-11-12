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
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight, Robot } from "@ledgerhq/lumen-ui-react/symbols";
import type { ManageAgentsCardViewProps } from "./ManageAgentsCardView.types";

export function ManageAgentsCardView({
  title,
  description,
  newBadgeLabel,
  onPress,
  testID,
}: ManageAgentsCardViewProps) {
  return (
    <Card type="interactive" onClick={onPress} data-testid={testID}>
      <CardHeader>
        <CardLeading>
          <Spot icon={Robot} />
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
            <CardContentDescription>{description}</CardContentDescription>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          {newBadgeLabel ? (
            <Tag
              label={newBadgeLabel}
              appearance="accent"
              size="md"
              data-testid={`${testID}-new-badge`}
            />
          ) : null}
          <ChevronRight size={24} />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
