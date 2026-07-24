import React, { memo } from "react";
import type { NightlyLayerViewProps } from "./types";

export const NightlyLayerView = memo(function NightlyLayerView({
  appVersion,
  watermarks,
}: NightlyLayerViewProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999999999999] opacity-10 text-muted-hover"
      data-testid="nightly-layer"
    >
      {watermarks.map(({ top, left }) => (
        <div
          key={`${top}-${left}`}
          className="absolute text-center -rotate-45 body-3"
          style={{ top, left }}
        >
          PRERELEASE
          <br />
          {appVersion}
        </div>
      ))}
    </div>
  );
});
