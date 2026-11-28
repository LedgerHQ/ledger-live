import React from "react";
import { ShieldLock } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { AddressDisplayedViewProps } from "./AddressDisplayedView.types";

export function AddressDisplayedView({
  title,
  description,
  gotItLabel,
  onGotIt,
}: AddressDisplayedViewProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: ShieldLock, size: 56 }}
      backgroundTone="info"
      size="hug"
      title={title}
      description={description}
      primaryCta={{
        label: gotItLabel,
        onPress: onGotIt,
        testID: "receive-address-displayed-got-it",
      }}
      testID="receive-address-displayed"
    />
  );
}
