import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ReceiveAddressViewProps } from "./ReceiveAddressView.types";

export function ReceiveAddressView(_props: ReceiveAddressViewProps) {
  return <Box lx={{ flex: 1 }} testID="receive-address" />;
}
