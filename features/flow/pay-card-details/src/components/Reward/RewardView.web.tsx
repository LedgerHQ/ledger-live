import React from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { DollarConvert } from "@ledgerhq/lumen-ui-react/symbols";
import type { RewardViewProps } from "./types";

export function RewardView({ amount, countervalue, subtitle }: RewardViewProps) {
  return (
    <Card type="info" data-testid="card-details-reward">
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={DollarConvert} size={48} />
          <CardContent>
            <CardContentTitle>{countervalue ?? amount}</CardContentTitle>
            <CardContentDescription>{subtitle}</CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}
