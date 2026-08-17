import { memo, useEffect, useRef } from "react";
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

  const trackEvent = () => {
    const { event, onMount, onUnmount, onUpdate, mandatory, ...properties } = props;
    track(event, properties, mandatory);
  };

  // Read through a ref so unmount reports the props the component had when it went away, and so the
  // effects below never need this function as a dependency.
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
      trackEventRef.current();
    }

    previousPropsRef.current = { ...props };
  }, [onUpdate, props]);

  return null;
};

export const Track = memo(TrackComponent);
