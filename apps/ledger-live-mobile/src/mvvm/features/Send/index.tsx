import React from "react";
import { Text, View } from "react-native";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: () => <></>,
  [SEND_FLOW_STEP.AMOUNT]: () => <></>,
  [SEND_FLOW_STEP.CONFIRMATION]: () => <></>,
  [SEND_FLOW_STEP.SIGNATURE]: () => <></>,
};

export function SendWorkflow() {
  return (
    <View style={{ margin: "auto" }}>
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <Text>New Send flow</Text>
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <Text>Still under construction</Text>
    </View>
  );
}
