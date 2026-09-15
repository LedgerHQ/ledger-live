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
  const firstRenderRef = useRef(true);

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
    if (onMount && firstRenderRef.current === true) {
      trackEventRef.current();
    }

    return () => {
      if (onUnmount) trackEventRef.current();
    };
  }, []);

  useEffect(() => {
    if (onUpdate && firstRenderRef.current === false) {
      trackEventRef.current();
    }
    firstRenderRef.current = false;
  }, [onUpdate, props]);

  return null;
};

export const Track = memo(TrackComponent);
