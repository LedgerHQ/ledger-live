import React, { useCallback, useMemo } from "react";

// TODO: use lumen
const TRACK_HEIGHT = 4;
const THUMB_SIZE = 16;
const TRACK_COLOR_FILLED = "#ffffff";
const TRACK_COLOR_UNFILLED = "rgba(255, 255, 255, 0.2)";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onValueChange: (value: number) => void;
};

export default function DepositSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onValueChange,
}: Props) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      const rounded = Math.round(v / step) * step;
      onValueChange(rounded);
    },
    [step, onValueChange],
  );

  const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const trackStyle = useMemo(
    () => ({
      background: `linear-gradient(to right, ${TRACK_COLOR_FILLED} ${percentage}%, ${TRACK_COLOR_UNFILLED} ${percentage}%)`,
    }),
    [percentage],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="body-2 text-muted">{label}</span>
        <span className="body-2-semi-bold text-base">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="slider-input w-full cursor-pointer"
        style={trackStyle}
      />
      <div className="flex items-center justify-between">
        <span className="caption text-muted">{formatValue(min)}</span>
        <span className="caption text-muted">{formatValue(max)}</span>
      </div>
      <style>{`
        .slider-input {
          -webkit-appearance: none;
          appearance: none;
          height: ${TRACK_HEIGHT}px;
          border-radius: ${TRACK_HEIGHT / 2}px;
          outline: none;
        }
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${THUMB_SIZE}px;
          height: ${THUMB_SIZE}px;
          border-radius: 50%;
          background: ${TRACK_COLOR_FILLED};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
