import React from "react";
import Lottie, { LottieProps } from "react-lottie";

// Read straight from the environment rather than through `@shared/env`: that pulls in the legacy
// `@ledgerhq/live-env`, which only resolves once `libs/` has been built, so any package testing a
// component that renders this one would fail to run. Playwright passes PLAYWRIGHT_RUN into the
// app's process env (see apps/ledger-live-desktop/tests/fixtures/common.ts).
// Read off globalThis so this stays typed without pulling Node globals into a web UI package.
function isPlaywrightRun(): boolean {
  const { process } = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };

  return !!process?.env?.PLAYWRIGHT_RUN;
}

export type AnimationProps = Readonly<{
  animation: unknown;
  width?: string;
  height?: string;
  loop?: boolean;
  autoplay?: boolean;
  rendererSettings?: LottieProps["options"]["rendererSettings"];
}>;

export function Animation({
  animation,
  loop = true,
  autoplay = true,
  width = "100%",
  height = "auto",
  rendererSettings = { preserveAspectRatio: "xMidYMin" },
}: AnimationProps): React.JSX.Element | null {
  const isPlaywright = isPlaywrightRun();

  if (!animation) return null;

  return (
    <div className="flex" style={{ maxHeight: "200px", maxWidth: "500px" }}>
      <Lottie
        style={{ width, height }}
        isClickToPauseDisabled
        ariaRole="animation"
        options={{
          loop,
          autoplay: !isPlaywright && autoplay,
          animationData: animation,
          rendererSettings,
        }}
      />
    </div>
  );
}
