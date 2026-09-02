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

const TrackComponent = (props: TrackProps): null => {
  const { onMount, onUnmount, onUpdate } = props;
  const hasMountedRef = useRef(false);

  const trackEvent = () => {
    const { event, onMount, onUnmount, onUpdate, mandatory, ...properties } = props;
    track(event, properties, mandatory);
  };

  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;

  useEffect(() => {
    if (onMount) trackEventRef.current();

    return () => {
      if (onUnmount) trackEventRef.current();
    };
  }, []);

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
