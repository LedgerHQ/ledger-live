import React, { type ReactNode } from "react";
import type { FeatureId } from "@shared/feature-flags";
import { useFeature } from "../hooks/useFeature";

type Props = {
  featureId: FeatureId;
  fallback?: ReactNode;
  children?: ReactNode;
};

export function FeatureToggle({ featureId, fallback, children }: Props): React.JSX.Element {
  const feature = useFeature(featureId);

  if (!feature || !feature.enabled) {
    return <>{fallback ?? null}</>;
  }

  return <>{children ?? null}</>;
}
