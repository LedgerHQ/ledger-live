import { memo, useEffect, useRef } from "react";
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
  const hasMountedRef = useRef(false);

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

  // `memo` bails out of the render when the parent re-renders with shallow-equal props, so reaching
  // this effect a second time means a prop really did change — no comparison of our own needed.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (onUpdate) trackEventRef.current();
  }, [onUpdate, props]);

  return null;
};

export const Track = memo(TrackComponent);
