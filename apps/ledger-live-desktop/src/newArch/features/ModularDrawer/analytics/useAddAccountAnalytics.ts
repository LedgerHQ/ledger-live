import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { AddAccountEventName, AddAccountEventParams } from "./addAccount.types";

type TrackAddAccountEvent = <T extends AddAccountEventName>(
  eventName: T,
  params: AddAccountEventParams[T],
) => void;

const useAddAccountAnalytics = () => {
  const trackAddAccountEvent = useCallback<TrackAddAccountEvent>((eventName, params) => {
    track(eventName, params);
  }, []);

  return { trackAddAccountEvent };
};

export default useAddAccountAnalytics;
