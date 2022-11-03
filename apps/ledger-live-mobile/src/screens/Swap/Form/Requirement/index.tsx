import React from "react";
import { ActionRequired } from "@ledgerhq/live-common/exchange/swap/types";
import { RequirementBanner } from "./Banner";
import { ScreenName } from "../../../../const";

interface Props {
  required: ActionRequired;
  provider?: string;
}

export function Requirement({ required, provider }: Props) {
  if (required === ActionRequired.None) {
    return null;
  }

  return (
    <RequirementBanner
      required={
        required as unknown as
          | ScreenName.SwapLogin
          | ScreenName.SwapKYC
          | ScreenName.SwapMFA
      }
      provider={provider}
    />
  );
}
