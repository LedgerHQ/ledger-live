import { Observable } from "rxjs";
import { toggleOnboardingEarlyCheckAction } from "@ledgerhq/live-common/deviceSDK/actions/toggleOnboardingEarlyCheck";
import { deviceOpt } from "../../scan";

export default {
  description: "Device SDK: toggle the onboarding early checks",
  args: [
    deviceOpt,
    {
      name: "toggleType",
      alias: "t",
      desc: "'enter' or 'exit' the onboarding early check",
      type: String,
    },
  ],
  job: ({
    device,
    toggleType,
  }: Partial<{
    device: string;
    toggleType: "enter" | "exit";
  }>) => {
    return new Observable(o => {
      if (toggleType && !["enter", "exit"].includes(toggleType)) {
        o.next(`❌ The toggle type should be either "enter" or "exit", not ${toggleType}`);
        return;
      }

      return toggleOnboardingEarlyCheckAction({
        deviceId: device ?? "",
        toggleType: toggleType ?? "enter",
      }).subscribe(o);
    });
  },
};
