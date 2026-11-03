import React from "react";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { AcknowledgementViewProps } from "./Acknowledgement.types";
import { AcknowledgementCheckbox } from "./AcknowledgementCheckbox";

export function AcknowledgementView({
  acknowledgement,
  cta,
  disclaimer,
  onConfirm,
  hasAcknowledged,
  onAcknowledgedChange,
}: AcknowledgementViewProps) {
  return (
    <>
      <AcknowledgementCheckbox
        label={acknowledgement}
        isChecked={hasAcknowledged}
        onChange={onAcknowledgedChange}
      />
      <Button appearance="base" size="lg" isFull disabled={!hasAcknowledged} onPress={onConfirm}>
        {cta}
      </Button>
      {disclaimer ? (
        <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
          {disclaimer}
        </Text>
      ) : null}
    </>
  );
}
