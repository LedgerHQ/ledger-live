import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { AddressVerifiedViewProps } from "./AddressVerifiedView.types";

export function AddressVerifiedView({
  title,
  description,
  doneLabel,
  onDone,
}: AddressVerifiedViewProps) {
  return (
    <InfoState
      preset="success"
      size="hug"
      title={title}
      description={description}
      primaryCta={{ label: doneLabel, onPress: onDone, testID: "receive-address-verified-done" }}
      testID="receive-address-verified"
    />
  );
}
