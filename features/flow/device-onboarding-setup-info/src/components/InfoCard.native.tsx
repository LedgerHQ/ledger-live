import React from "react";
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { setupInfoTestIds } from "../internals";
import type { InfoCardProps } from "../useSetupInfoViewModel";

export function InfoCard({ title, onPress }: InfoCardProps) {
  return (
    <Card type="interactive" onPress={onPress} testID={setupInfoTestIds.card}>
      <CardHeader>
        <CardLeading>
          <CardContent>
            <CardContentTitle>{title}</CardContentTitle>
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <Information size={16} color="muted" />
        </CardTrailing>
      </CardHeader>
    </Card>
  );
}
