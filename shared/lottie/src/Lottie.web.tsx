import React, { useEffect, useMemo, useRef, useState } from "react";
import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import type { LottieBaseProps } from "./types";

/** A `.lottie` / `.json` URL, or parsed animation data. */
export type LottieSource = string | Record<string, unknown>;

export type LottieProps = LottieBaseProps &
  Readonly<{
    source: LottieSource;
    fit?: "contain" | "cover" | "fill" | "none" | "fit-width" | "fit-height";
    /** [x, y] in the 0-1 range, [0.5, 0.5] centers. */
    align?: [number, number];
    style?: React.CSSProperties;
    className?: string;
    role?: React.AriaRole;
  }>;

const RENDER_CONFIG = { autoResize: true };
const FILL: React.CSSProperties = { position: "absolute", inset: 0 };
// A replaced element reports its size to a shrink-to-fit parent yet can still shrink, unlike a canvas.
const SPACER: React.CSSProperties = { display: "block", maxWidth: "100%", height: "auto" };

export function Lottie({
  source,
  loop = false,
  autoPlay = true,
  paused,
  speed,
  fit,
  align,
  style,
  className,
  role,
  testID,
  onComplete,
}: LottieProps): React.JSX.Element {
  const [player, setPlayer] = useState<DotLottie | null>(null);
  const currentSource = useRef(source);
  const loadedSource = useRef<LottieSource | null>(null);
  currentSource.current = source;

  useEffect(() => {
    if (!player) return;
    loadedSource.current = player.isLoaded ? currentSource.current : null;
    const markLoaded = () => {
      loadedSource.current = currentSource.current;
    };
    player.addEventListener("load", markLoaded);
    return () => player.removeEventListener("load", markLoaded);
  }, [player]);

  useEffect(() => {
    if (!player || !onComplete) return;
    player.addEventListener("complete", onComplete);
    return () => player.removeEventListener("complete", onComplete);
  }, [player, onComplete]);

  useEffect(() => {
    if (!player || paused === undefined) return;
    if (paused) {
      player.pause();
      return;
    }
    if (loadedSource.current === source) {
      player.play();
      return;
    }
    const play = () => player.play();
    player.addEventListener("load", play);
    return () => player.removeEventListener("load", play);
  }, [player, paused, source]);

  const layout = useMemo(() => (fit || align ? { fit, align } : undefined), [fit, align]);
  const size = typeof source === "string" ? undefined : getSize(source);

  const animation = (
    <DotLottieReact
      {...(typeof source === "string" ? { src: source } : { data: source })}
      loop={loop}
      autoplay={autoPlay}
      speed={speed}
      layout={layout}
      renderConfig={RENDER_CONFIG}
      style={size ? FILL : style}
      className={size ? undefined : className}
      role={size ? undefined : role}
      data-testid={size ? undefined : testID}
      dotLottieRefCallback={setPlayer}
    />
  );

  if (!size) return animation;

  return (
    <div
      style={{ position: "relative", ...style }}
      className={className}
      role={role}
      data-testid={testID}
    >
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        aria-hidden
        style={SPACER}
      />
      {animation}
    </div>
  );
}

function getSize({ w, h }: Record<string, unknown>): { w: number; h: number } | undefined {
  return typeof w === "number" && typeof h === "number" && w > 0 && h > 0 ? { w, h } : undefined;
}
