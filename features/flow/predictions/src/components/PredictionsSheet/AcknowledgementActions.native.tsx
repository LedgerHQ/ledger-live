import React, { useState } from "react";
import { Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { AcknowledgementCheckbox } from "./AcknowledgementCheckbox";

type AcknowledgementActionsProps = Readonly<{
  acknowledgement: string;
  cta: string;
  disclaimer?: string;
  onConfirm: () => void;
}>;

export function AcknowledgementActions({
  acknowledgement,
  cta,
  disclaimer,
  onConfirm,
}: AcknowledgementActionsProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <>
      <AcknowledgementCheckbox
        label={acknowledgement}
        isChecked={hasAcknowledged}
        onChange={setHasAcknowledged}
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
