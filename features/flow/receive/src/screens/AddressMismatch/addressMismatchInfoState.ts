import type { ComponentType } from "react";
import type { InfoStateProps } from "@shared/ui-info-state";
import type { AddressMismatchViewProps } from "./AddressMismatchView.types";

/** The mismatch screen's InfoState; only the warning icon comes from the platform. */
export function addressMismatchInfoState(
  {
    title,
    description,
    contactSupportLabel,
    closeLabel,
    onContactSupport,
    onClose,
  }: AddressMismatchViewProps,
  warningIcon: ComponentType,
): InfoStateProps {
  return {
    preset: "spot",
    spotProps: { icon: warningIcon, appearance: "error" },
    backgroundTone: "error",
    size: "hug",
    title,
    description,
    primaryCta: {
      label: contactSupportLabel,
      onPress: onContactSupport,
      testID: "receive-address-mismatch-contact-support",
    },
    secondaryCta: {
      label: closeLabel,
      onPress: onClose,
      testID: "receive-address-mismatch-close",
    },
    testID: "receive-address-mismatch",
  };
}
