import React, { Component, Suspense } from "react";
import { useLLDCoinFamily } from "~/renderer/families";
import logger from "~/renderer/logger";
import type { FamilyAppEffectsViewModel } from "./types";

// A family that fails to load only loses its effect, never the app.
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

function FamilyAppEffect({ family }: { family: string }) {
  const { AppEffect } = useLLDCoinFamily(family);
  return AppEffect ? <AppEffect /> : null;
}

export function FamilyAppEffectsView({ viewModel }: { viewModel: FamilyAppEffectsViewModel }) {
  return (
    <>
      {viewModel.families.map(family => (
        <FamilyAppEffectBoundary key={family} family={family}>
          <Suspense fallback={null}>
            <FamilyAppEffect family={family} />
          </Suspense>
        </FamilyAppEffectBoundary>
      ))}
    </>
  );
}
