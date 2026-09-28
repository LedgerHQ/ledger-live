import React from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { DollarConvert } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { RewardViewProps } from "./types";

export function RewardView({ amount, subtitle }: RewardViewProps) {
  return (
    <Card type="info" testID="card-details-reward">
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={DollarConvert} size={48} />
          <CardContent>
            <CardContentTitle>{amount}</CardContentTitle>
            <CardContentDescription>{subtitle}</CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}
