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

  // Refs used to avoid duplicate events in development - see React.StrictMode tests for details
  const mountTrackedRef = useRef(false);
  const lastSeenPropsRef = useRef<TrackProps | null>(null);
  const pendingUnmountRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    clearTimeout(pendingUnmountRef.current);
    pendingUnmountRef.current = undefined;

    if (onMount && !mountTrackedRef.current) {
      mountTrackedRef.current = true;
      trackEventRef.current();
    }

    return () => {
      if (!onUnmount) return;

      pendingUnmountRef.current = setTimeout(() => {
        pendingUnmountRef.current = undefined;
        trackEventRef.current();
      });
    };
  }, []);

  useEffect(() => {
    const lastSeenProps = lastSeenPropsRef.current;
    lastSeenPropsRef.current = props;
    if (lastSeenProps === null || lastSeenProps === props) return;
    if (onUpdate) trackEventRef.current();
  }, [onUpdate, props]);

  return null;
};

export const Track = memo(TrackComponent);
