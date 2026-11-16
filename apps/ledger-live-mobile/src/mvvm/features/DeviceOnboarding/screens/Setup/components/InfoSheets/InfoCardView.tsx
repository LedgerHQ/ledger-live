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
import { setupTestIds } from "LLM/features/DeviceOnboarding/testIds";
import type { InfoCardProps } from "./useInfoSheetsViewModel";

export function InfoCardView({ title, onPress }: InfoCardProps) {
  return (
    <Card type="interactive" onPress={onPress} testID={setupTestIds.infoCard}>
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
