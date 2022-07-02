import React from "react";
import { ActionRequired } from "@ledgerhq/live-common/lib/exchange/swap/types";
import { Banner } from "./Banner";

interface Props {
  required: ActionRequired;
  provider?: string;
}

export function Requirement({ required, provider }: Props) {
  if (!provider || required === ActionRequired.None) {
    return null;
  }

  return <Banner required={required} provider={provider} />;
}
