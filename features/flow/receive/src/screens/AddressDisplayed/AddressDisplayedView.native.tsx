import React from "react";
import { ShieldLock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { AddressDisplayedViewProps } from "../../types";

export function AddressDisplayedView({
  title,
  description,
  gotItCta,
  onGotIt,
}: AddressDisplayedViewProps) {
  return (
    <InfoState
      preset="spot"
      size="hug"
      spotProps={{ icon: ShieldLock, size: 56 }}
      title={title}
      description={description}
      primaryCta={{ label: gotItCta, onPress: onGotIt, testID: "receive-address-displayed-got-it" }}
      testID="receive-address-displayed"
    />
  );
}
