import { track } from "~/renderer/analytics/segment";
import { ModularDrawerEventName, ModularDrawerEventParams } from "./const";

export const trackModularDrawerEvent = <T extends ModularDrawerEventName>(
  eventName: T,
  params: ModularDrawerEventParams[T],
) => {
  track(eventName, params);
};
