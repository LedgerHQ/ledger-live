import React, { Component, Suspense } from "react";
import logger from "~/renderer/logger";
import type { FamilyAppEffectsViewModel } from "./types";

// A family whose effect fails to load or run only loses its effect, never the app.
class FamilyAppEffectBoundary extends Component<
  { family: string; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    logger.error(`app effect of family ${this.props.family} failed`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function FamilyAppEffectsView({
  viewModel,
}: Readonly<{ viewModel: FamilyAppEffectsViewModel }>) {
  return (
    <>
      {viewModel.effects.map(({ family, AppEffect }) => (
        <FamilyAppEffectBoundary key={family} family={family}>
          <Suspense fallback={null}>
            <AppEffect />
          </Suspense>
        </FamilyAppEffectBoundary>
      ))}
    </>
  );
}
