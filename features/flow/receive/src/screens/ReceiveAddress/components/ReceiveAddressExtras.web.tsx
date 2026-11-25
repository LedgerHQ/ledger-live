import React from "react";
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";
import type { ReceiveAddressExtrasProps } from "./ReceiveAddressExtras.types";

export function ReceiveAddressExtras({ helpCard }: ReceiveAddressExtrasProps) {
  return (
    <div className="flex flex-col gap-8" data-testid="receive-address-extras">
      <Card type="interactive" onClick={helpCard.onPress} data-testid="receive-address-help-card">
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
    </div>
  );
}
