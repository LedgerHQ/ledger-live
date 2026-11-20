import React from "react";
import { ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { AddressDisplayedViewProps } from "./AddressDisplayedView.types";

export function AddressDisplayedView({ title, description }: AddressDisplayedViewProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: ShieldLock, size: 56 }}
      backgroundTone="info"
      size="hug"
      title={title}
      description={description}
      testID="receive-address-displayed"
    />
  );
}
