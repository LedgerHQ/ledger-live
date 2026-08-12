import React from "react";
import { CardLogin, type OpenHostedLogin } from "@features/flow-pay-card-auth";
import { FeatureTour, type FeatureTourProps } from "@features/flow-pay-card-feature-tour";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type PayTabViewProps = {
  readonly top: number;
  readonly openHostedLogin: OpenHostedLogin;
  readonly featureTour: FeatureTourProps;
};

export function PayTabView({ top, openHostedLogin, featureTour }: PayTabViewProps) {
  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas" }}
      style={{ paddingTop: top }}
      testID="paytab-screen"
    >
      <CardLogin openHostedLogin={openHostedLogin} />
      <FeatureTour {...featureTour} />
    </Box>
  );
}
