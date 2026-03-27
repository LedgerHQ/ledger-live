import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = {
  completed: boolean;
};

export function OperationsListFooter({ completed }: Readonly<Props>) {
  if (!completed)
    return <Spinner size={24} lx={spinnerStyle} testID="operations-list-footer-spinner" />;
  return null;
}

const spinnerStyle: LumenViewStyle = {
  // Workaround to remove once we have bumped Lumen
  alignSelf: "center",
  marginVertical: "s24",
};
