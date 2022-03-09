import React, { ReactNode } from "react";

import useFeature from "./useFeature";
import { FeatureId } from "./types";

type Props = {
  feature: FeatureId;
  fallback?: ReactNode;
  children?: ReactNode;
};

export const FeatureToggle = ({
  feature: featureId,
  fallback,
  children,
}: Props): JSX.Element => {
  const feature = useFeature(featureId);

  if (!feature || !feature.enabled) {
    return <>{fallback || null}</>;
  }

  return <>{children || null}</>;
};
