import React from "react";
import { cn } from "LLD/utils/cn";
import type { DeviceScreenImageViewModel } from "./useDeviceScreenImageViewModel";

export interface DeviceScreenImageViewProps extends DeviceScreenImageViewModel {
  readonly src: string;
}

export function DeviceScreenImageView({
  src,
  imageRef,
  aspectRatio,
  undecodable,
  tappable,
  handleLoad,
  handleError,
  handlePointerDown,
  handlePointerUp,
}: DeviceScreenImageViewProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm bg-black",
        tappable ? "cursor-pointer" : "cursor-default",
      )}
      style={{ aspectRatio: aspectRatio ?? 1 }}
    >
      <img
        ref={imageRef}
        src={src}
        alt="Device screen"
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        // Device screens are tiny; smoothing them turns text to mush. A hold
        // must not start a native image drag or a text selection either.
        className="block h-full w-full touch-none select-none object-contain [image-rendering:pixelated] [-webkit-user-drag:none]"
        data-testid="device-screen-image"
      />
      {undecodable && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-canvas-muted p-12 text-center"
          data-testid="device-screen-undecodable"
        >
          <span className="body-4 text-error">Screenshot could not be decoded</span>
          <span className="body-4 text-muted">
            The mock server may predate binary passthrough on its Speculos proxy.
          </span>
        </div>
      )}
    </div>
  );
}
