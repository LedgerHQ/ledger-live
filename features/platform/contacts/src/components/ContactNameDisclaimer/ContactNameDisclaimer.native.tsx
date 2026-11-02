import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-rnative";
import type { ContactNameDisclaimerProps } from "./ContactNameDisclaimer.types";

export function ContactNameDisclaimer({
  text,
  testID,
}: ContactNameDisclaimerProps): React.JSX.Element {
  return <Banner appearance="info" description={text} testID={testID} />;
}
