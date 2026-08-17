import { memo, useCallback, useEffect, useRef } from "react";
import isEqual from "lodash/isEqual";
import { track } from "@shared/analytics";

export type TrackProps = {
  onMount?: boolean;
  onUnmount?: boolean;
  onUpdate?: boolean;
  event: string;
  mandatory?: boolean;
  [key: string]: unknown;
};

/** Tracks `event` through the React lifecycle. Every other prop is sent as an event property. */
const TrackComponent = (props: TrackProps): null => {
  const { onMount, onUnmount, onUpdate } = props;
  const previousPropsRef = useRef<TrackProps | null>(null);

  const trackEvent = useCallback(() => {
    const { event, onMount, onUnmount, onUpdate, mandatory, ...properties } = props;
    track(event, properties, mandatory);
  }, [props]);

  // Read through a ref so unmount reports the props the component had when it went away.
  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;

  useEffect(() => {
    if (onMount) trackEventRef.current();

    return () => {
      if (onUnmount) trackEventRef.current();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!onUpdate) return;

    const previousProps = previousPropsRef.current;
    if (previousProps && !isEqual(previousProps, props)) {
      trackEvent();
    }

    previousPropsRef.current = { ...props };
  }, [onUpdate, props, trackEvent]);

  return null;
};

export const Track = memo(TrackComponent);
