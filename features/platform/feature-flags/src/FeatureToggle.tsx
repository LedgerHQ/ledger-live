import { type ReactNode } from "react";
import type { FeatureId } from "@shared/feature-flags";
import { useFeature } from "./useFeature";

type Props = {
  featureId: FeatureId;
  fallback?: ReactNode;
  children?: ReactNode;
};

export const FeatureToggle = ({ featureId, fallback, children }: Props): React.JSX.Element => {
  const feature = useFeature(featureId);

  if (!feature || !feature.enabled) {
    return <>{fallback || null}</>;
  }

  return <>{children || null}</>;
};
