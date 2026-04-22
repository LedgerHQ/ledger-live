import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = {
  completed: boolean;
};

export function OperationsListFooter({ completed }: Readonly<Props>) {
  if (!completed)
    return (
      <Spinner size={24} color="base" lx={spinnerStyle} testID="operations-list-footer-spinner" />
    );
  return null;
}

const spinnerStyle: LumenViewStyle = {
  marginVertical: "s24",
  alignSelf: "center",
};
