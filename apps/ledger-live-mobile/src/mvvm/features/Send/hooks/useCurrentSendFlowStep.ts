import { useMemo } from "react";
import { useRoute } from "@react-navigation/native";
import type { SendFlowStep } from "@ledgerhq/live-common/flows/send/types";

import { SEND_FLOW_CONFIG } from "../constants";
import type { SendStepConfig } from "../types";

export function useCurrentSendFlowStep(): readonly [
  SendFlowStep | undefined,
  SendStepConfig | undefined,
] {
  const route = useRoute();

  return useMemo(() => {
    const stepConfig = Object.values(SEND_FLOW_CONFIG.stepConfigs).find(
      config => (config.screenName ?? `SendFlow${config.id}`) === route.name,
    );

    if (!stepConfig) return [undefined, undefined];

    return [stepConfig.id, stepConfig];
  }, [route.name]);
}
