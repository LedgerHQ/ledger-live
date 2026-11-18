import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { VerifyAddressErrorProps } from "./VerifyAddressError.types";
import { useVerifyAddressErrorViewModel } from "./useVerifyAddressErrorViewModel";

/** The device cannot show this address: the verification ends on its error. */
export function VerifyAddressError(props: VerifyAddressErrorProps) {
  const { title, description, closeLabel, onClose } = useVerifyAddressErrorViewModel(props);

  return (
    <InfoState
      preset="error"
      size="hug"
      title={title}
      description={description}
      primaryCta={{ label: closeLabel, onPress: onClose }}
      testID="receive-verify-address-error"
    />
  );
}
