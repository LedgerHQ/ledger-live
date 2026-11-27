import React, { useState } from "react";
import { InteractiveIcon } from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { InfoSheet } from "./InfoSheet";

export function InfoTooltip(props: Readonly<{ title: string; info: string }>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <InteractiveIcon
        icon={Information}
        size={16}
        iconType="stroked"
        accessibilityLabel={props.title}
        onPress={() => setIsOpen(true)}
      />
      <InfoSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={props.title}
        info={props.info}
      />
    </>
  );
}
