import React from "react";
import { CardLogin, type OpenHostedLogin } from "@features/flow-pay-card-auth";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type PayTabViewProps = {
  readonly top: number;
  readonly openHostedLogin: OpenHostedLogin;
};

export function PayTabView({ top, openHostedLogin }: PayTabViewProps) {
  return (
    <Box style={{ flex: 1, paddingTop: top }} testID="paytab-screen">
      <CardLogin openHostedLogin={openHostedLogin} />
    </Box>
  );
}
