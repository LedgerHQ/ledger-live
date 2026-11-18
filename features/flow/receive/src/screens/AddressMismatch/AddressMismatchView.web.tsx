import React from "react";
import { WarningFill } from "@ledgerhq/lumen-ui-react/symbols";
import { InfoState } from "@shared/ui-info-state";
import type { AddressMismatchViewProps } from "./AddressMismatchView.types";

export function AddressMismatchView({
  title,
  description,
  contactSupportLabel,
  closeLabel,
  onContactSupport,
  onClose,
}: AddressMismatchViewProps) {
  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: WarningFill, appearance: "error" }}
      backgroundTone="error"
      size="hug"
      title={title}
      description={description}
      primaryCta={{
        label: contactSupportLabel,
        onPress: onContactSupport,
        testID: "receive-address-mismatch-contact-support",
      }}
      secondaryCta={{
        label: closeLabel,
        onPress: onClose,
        testID: "receive-address-mismatch-close",
      }}
      testID="receive-address-mismatch"
    />
  );
}
