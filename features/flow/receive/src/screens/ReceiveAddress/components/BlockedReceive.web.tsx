import React from "react";
import { InfoState } from "@shared/ui-info-state";
import type { BlockedReceiveProps } from "./BlockedReceive.types";

export function BlockedReceive({ blocked }: BlockedReceiveProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={blocked.title}
      description={blocked.description}
      primaryCta={
        blocked.continueAction && {
          label: blocked.continueAction.label,
          onPress: blocked.continueAction.onPress,
          testID: "receive-address-continue",
        }
      }
      testID="receive-address-blocked"
    />
  );
}
