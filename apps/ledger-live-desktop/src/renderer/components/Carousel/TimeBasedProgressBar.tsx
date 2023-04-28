import React, { useCallback, useEffect, useState } from "react";
import { useSpring, animated } from "react-spring";

const easing = (t: number) => t; // linear easing function

type Props = {
  duration: number;
  onComplete: () => void;
  paused?: boolean;
};

const TimeBasedProgressBar = ({ duration, onComplete, paused }: Props) => {
  const [outOfFocusPaused, setOutOfFocusPaused] = useState(false);
  const progress = useSpring({
    from: { value: 0 },
    to: { value: 1 },
    config: { duration, easing },
    delay: duration,
    pause: paused || outOfFocusPaused,
    onRest: () => {
      if (!outOfFocusPaused) {
        onComplete();
      }
    },
  });

  const onWindowFocus = useCallback(() => {
    setOutOfFocusPaused(false);
  }, []);

  const onWindowBlur = useCallback(() => {
    setOutOfFocusPaused(true);
  }, []);

  useEffect(() => {
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [onWindowFocus, onWindowBlur]);

  return (
    <div style={{ width: "100%", height: 5 }}>
      {!paused && !outOfFocusPaused && (
        <animated.div
          style={{
            height: 5,
            width: "100%",
            borderRadius: 4,
            background: "#FFFFFF33",
            // @ts-expect-error react-spring types are broken
            transform: progress.value.interpolate((v: number) => `scaleX(${v})`),
            transformOrigin: "left center",
          }}
        />
      )}
    </div>
  );
};

export default TimeBasedProgressBar;
