import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { getFlowStackScreenOptions } from "../../FlowWizard/FlowStackNavigator";
import { SEND_STEP_CONFIGS } from "../constants";

describe("SEND_STEP_CONFIGS", () => {
  it("GIVEN a recipient step that is not first in the stack WHEN its options resolve THEN the swipe back stays off", () => {
    const options = getFlowStackScreenOptions({
      defaultOptions: { gestureEnabled: true },
      customOptions: SEND_STEP_CONFIGS[SEND_FLOW_STEP.RECIPIENT].screenOptions,
    });

    expect(options.gestureEnabled).toBe(false);
  });
});
