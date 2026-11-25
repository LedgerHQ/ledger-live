import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ReceiveAddressExtrasProps } from "./ReceiveAddressExtras.types";

export function ReceiveAddressExtras({ helpCard }: ReceiveAddressExtrasProps) {
  return (
    <Box lx={{ gap: "s8" }} testID="receive-address-extras">
      <Card type="interactive" onPress={helpCard.onPress} testID="receive-address-help-card">
        <CardHeader>
          <CardLeading>
            <CardContent>
              <CardContentTitle>{helpCard.title}</CardContentTitle>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <ChevronRight size={20} />
          </CardTrailing>
        </CardHeader>
      </Card>
    </Box>
  );
}
