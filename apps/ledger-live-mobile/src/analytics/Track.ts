import { useEffect, useRef, memo, useCallback } from "react";
import { track } from "./segment";
import isEqual from "lodash/isEqual";

type Props = {
  onMount?: boolean;
  onUnmount?: boolean;
  onUpdate?: boolean;
  event: string;
  [key: string]: unknown;
};

const Track = (props: Props): null => {
  const { onMount, onUnmount, onUpdate } = props;
  const prevPropsRef = useRef<Props | null>(null);

  const trackEvent = useCallback(() => {
    const { event, onMount, onUnmount, onUpdate, ...properties } = props;
    track(event, properties);
  }, [props]);

  useEffect(() => {
    if (onMount) trackEvent();

    return () => {
      if (onUnmount) trackEvent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!onUpdate) return;

    const prevProps = prevPropsRef.current;

    if (prevProps && !isEqual(prevProps, props)) {
      trackEvent();
    }

    prevPropsRef.current = { ...props };
  }, [onUpdate, props, trackEvent]);

  return null;
};

export default memo(Track);
