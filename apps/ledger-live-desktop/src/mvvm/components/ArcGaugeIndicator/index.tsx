/* oxlint-disable react-hooks/exhaustive-deps */
import React, { useId, useState, useEffect } from "react";

const ANIMATION_DURATION = 1200;

type ArcGaugeIndicatorProps = {
  value: number;
  startColor: string;
  endColor: string;
};

export const ArcGaugeIndicator = ({ value, startColor, endColor }: ArcGaugeIndicatorProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);

  // Unique per instance so multiple gauges on the same page don't share a gradient.
  const gradientId = useId();

  useEffect(() => {
    const startValue = animatedValue;
    const endValue = value;
    const startTime = Date.now();
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      // Cubic ease-out easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * eased;
      setAnimatedValue(currentValue);
      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value]);

  // Calculate angle based on value (0-100)
  // Arc goes from 180° (left) to 0° (right)
  const angle = 180 - (animatedValue / 100) * 180;
  const angleRad = (angle * Math.PI) / 180;

  // Center point and radius of the arc
  const centerX = 21.5814;
  const centerY = 21.5814;
  const radius = 19.5814; // Distance from center to the arc

  // Calculate circle position
  const circleX = centerX + radius * Math.cos(angleRad);
  const circleY = centerY - radius * Math.sin(angleRad);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="-2 -2 47 35"
      fill="none"
    >
      <path
        d="M3.37572 28.8056C2.48799 26.5704 2 24.1329 2 21.5814C2 10.7669 10.7669 2 21.5814 2C32.396 2 41.1629 10.7669 41.1629 21.5814C41.1629 24.1323 40.6751 26.5693 39.7877 28.8041"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* White indicator circle */}
      <circle cx={circleX} cy={circleY} r="4" fill="white" stroke="black" strokeWidth="1" />
      {/* Value text in the center */}
      <text
        x={centerX}
        y={centerY + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        className="body-2-semi-bold"
      >
        {displayValue}
      </text>
      <defs>
        <linearGradient
          id={gradientId}
          x1="2"
          y1="15.4028"
          x2="41.1629"
          y2="15.4028"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
      </defs>
    </svg>
  );
};
