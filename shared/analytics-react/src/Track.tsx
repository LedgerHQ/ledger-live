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
    const {
      event,
      onMount: _onMount,
      onUnmount: _onUnmount,
      onUpdate: _onUpdate,
      mandatory,
      ...properties
    } = props;
    track(event, properties, { mandatory });
  };

  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;

  useEffect(() => {
    if (onMount && hasMountedRef.current === false) {
      trackEventRef.current();
    }

    if (onUpdate && hasMountedRef.current === true) {
      trackEventRef.current();
    }

    hasMountedRef.current = true;
  }, [onUpdate, onMount, props]);

  useEffect(() => {
    return () => {
      if (onUnmount) trackEventRef.current();
    };
  }, []);

  return null;
};

export const Track = memo(TrackComponent);
