import React, { useEffect } from "react";
import { animated, useSpring } from "react-spring";

type Props = {
  duration: number;
  onComplete?: () => void;
  nonce?: number;
};

export function TimeBasedProgressBar({ duration, onComplete, nonce = 1 }: Props) {
  const style = useSpring({
    from: { width: "0%" },
    to: { width: "100%" },
    config: { duration, friction: 0, tension: 125, precision: 0.1 },
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (nonce && onComplete) onComplete();
    }, duration);
    return () => {
      clearTimeout(timeout);
    };
  }, [duration, onComplete, nonce]);

  return (
    <div
      style={{
        width: "100%",
        height: 5,
      }}
    >
      <animated.div
        style={{
          ...style,
          height: 5,
          transformOrigin: "left center",
          background: "#8a80db",
        }}
      />
    </div>
  );
}
