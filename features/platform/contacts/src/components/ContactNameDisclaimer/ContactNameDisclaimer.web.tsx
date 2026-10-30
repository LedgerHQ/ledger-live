import React from "react";
import { InformationFill } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactNameDisclaimerProps } from "./ContactNameDisclaimer.types";

export function ContactNameDisclaimer({
  text,
  disclaimerId,
  testID,
}: ContactNameDisclaimerProps): React.ReactNode {
  return (
    <div
      className="flex gap-8 rounded-sm bg-muted py-10 px-12 text-base"
      id={disclaimerId}
      data-testid={testID}
    >
      <InformationFill size={24} className="mt-2 shrink-0" aria-hidden />
      <p className="body-2">{text}</p>
    </div>
  );
}
