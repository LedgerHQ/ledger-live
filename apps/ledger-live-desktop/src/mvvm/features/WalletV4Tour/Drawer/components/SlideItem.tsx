import React from "react";
import { motion, useTransform } from "framer-motion";
import { useSlidesContext } from "LLD/components/Slides";

interface SlideItemProps {
  readonly index: number;
  readonly title: string;
  readonly description: string;
}

function interpolate(
  progress: number,
  inputRange: [number, number, number],
  outputRange: [number, number, number],
): number {
  const [x0, x1, x2] = inputRange;
  const [y0, y1, y2] = outputRange;
  if (progress <= x0) return y0;
  if (progress >= x2) return y2;
  if (progress <= x1) return y0 + ((y1 - y0) * (progress - x0)) / (x1 - x0);
  return y1 + ((y2 - y1) * (progress - x1)) / (x2 - x1);
}

const THRESHOLD = 0.6;
const STAGGER_THRESHOLD = 0.5;

export function SlideItem({ index, title, description }: SlideItemProps) {
  const { progress } = useSlidesContext();

  const slideOpacity = useTransform(
    progress,
    [index - THRESHOLD, index, index + THRESHOLD],
    [0, 1, 0],
  );
  const slideTransform = useTransform(progress, v => {
    const x = interpolate(v, [index - THRESHOLD, index, index + THRESHOLD], [20, 0, -20]);
    const scale = interpolate(v, [index - THRESHOLD, index, index + THRESHOLD], [0.98, 1, 0.98]);
    return `translateX(${x}%) scale(${scale})`;
  });

  const textOpacity = useTransform(
    progress,
    [index - STAGGER_THRESHOLD, index, index + STAGGER_THRESHOLD],
    [0, 1, 0],
  );
  const textTransform = useTransform(progress, v => {
    const x = interpolate(
      v,
      [index - STAGGER_THRESHOLD, index, index + STAGGER_THRESHOLD],
      [-5, 0, 5],
    );
    return `translateX(${x}%)`;
  });

  return (
    <div className="flex size-full flex-col">
      <motion.div
        style={{
          opacity: slideOpacity,
          transform: slideTransform,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          className="flex flex-1 flex-col items-center px-20"
          style={{ gap: 40, paddingBottom: 8 }}
        >
          <div
            className="flex h-[240px] w-full shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--color-neutral-c20, #f0f0f0)" }}
          >
            <svg width="64" height="64" viewBox="0 0 48 48" fill="none" style={{ color: "#999" }}>
              <rect
                x="6"
                y="10"
                width="36"
                height="28"
                rx="3"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M6 32l10-8 6 5 8-10 12 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-col items-center text-center" style={{ pointerEvents: "none" }}>
            <motion.div
              style={{
                opacity: textOpacity,
                transform: textTransform,
              }}
            >
              <h3 className="m-0 mb-8 heading-4-semi-bold">{title}</h3>
              <p className="m-0 body-2 text-muted">{description}</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
