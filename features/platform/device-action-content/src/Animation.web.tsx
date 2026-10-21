import React from "react";
import { Lottie, type LottieProps } from "@shared/lottie/web";

// Read straight from the environment rather than through `@shared/env`: that pulls in the legacy
// `@ledgerhq/live-env`, which only resolves once `libs/` has been built, so any package testing a
// component that renders this one would fail to run. Playwright passes PLAYWRIGHT_RUN into the
// app's process env (see apps/ledger-live-desktop/tests/fixtures/common.ts).
declare const process: { env: Record<string, string | undefined> };

function isPlaywrightRun(): boolean {
  try {
    return !!process.env.PLAYWRIGHT_RUN;
  } catch {
    return false;
  }
}

export type AnimationProps = Readonly<{
  animation?: LottieProps["source"] | null;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  fit?: LottieProps["fit"];
  align?: LottieProps["align"];
}>;

export function Animation({
  animation,
  loop = true,
  autoplay = true,
  width,
  height = "auto",
  fit = "contain",
  align = [0.5, 0],
}: AnimationProps): React.JSX.Element | null {
  const isPlaywright = isPlaywrightRun();

  if (!animation) return null;

  return (
    <div className="flex" style={{ maxHeight: "200px", maxWidth: "500px" }}>
      <Lottie
        source={animation}
        style={width ? { width, height } : { height }}
        role="presentation"
        loop={loop}
        autoPlay={!isPlaywright && autoplay}
        fit={fit}
        align={align}
      />
    </div>
  );
}
