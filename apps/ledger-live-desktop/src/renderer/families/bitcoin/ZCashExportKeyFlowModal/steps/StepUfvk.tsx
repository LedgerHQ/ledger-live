import React from "react";
import invariant from "invariant";
import { Trans } from "react-i18next";
import { Text, Alert } from "@ledgerhq/react-ui";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { StepProps } from "../types";
import { Container } from "../shared/Container";

function StepUfvk({ account }: Readonly<StepProps>) {
  invariant(account, "account required");

  return (
    <Container>
      <TrackPage category="Export ZCash key" name="Step UFVK" flow="exportUfvk" currency="zcash" />
      <Alert
        type={"info"}
        containerProps={{ p: 12, borderRadius: 8 }}
        renderContent={() => (
          <Text
            variant="paragraphLineHeight"
            fontWeight="semiBold"
            color="neutral.c100"
            fontSize={13}
          >
            <Trans i18nKey="zcash.shielded.flows.export.steps.ufvk.text" />
          </Text>
        )}
      />
    </Container>
  );
}

export default StepUfvk;
