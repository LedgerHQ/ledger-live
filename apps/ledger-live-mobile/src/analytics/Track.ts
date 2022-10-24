import { useEffect, memo } from "react";
// eslint-disable-next-line import/no-cycle
import { track } from "./segment";

type Props = {
  onMount?: boolean;
  onUnmount?: boolean;
  onUpdate?: boolean;
  event: string;
  mandatory?: boolean;
  [key: string]: unknown;
};

export default memo((props: Props): null => {
  const { event, onMount, onUnmount, onUpdate } = props;

  function doTrack() {
    const { event, onMount, onUnmount, onUpdate, mandatory, ...properties } =
      props;
    track(event, properties, mandatory);
  }

  useEffect(
    function mount() {
      if (typeof event !== "string") {
        console.warn("analytics Track: invalid event=", event);
      }

      if (onMount) doTrack();
      return function unmount() {
        if (onUnmount) doTrack();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (onUpdate) {
    doTrack();
  }

  return null;
});
